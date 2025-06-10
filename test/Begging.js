const { expect } = require("chai");
const { ethers, deployments, upgrades } = require('hardhat');
const {
    time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Begging", function () {
    let account1, account2, account3, account4, deployer;
    let BeggingProxy;
    let beggingFactory;

    beforeEach(async function () {
        await deployments.fixture(["deployBegging"])
        const factoryContract = await deployments.get("BeggingFactory");
        beggingFactory = await ethers.getContractAt("BeggingFactory", factoryContract.address);
        [deployer, account1, account2, account3, account4,] = await ethers.getSigners();
    });

    describe("beacon代理測試", () => {
        beforeEach(async function () {
            const tx = await beggingFactory.connect(account1).createBegging("乞討測試", "純要飯", 86400)
            const receipt = await tx.wait();

            // 取得proxy合約地址
            let beggingAddress;
            if (receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = beggingFactory.interface.parseLog(log);
                        if (parsedLog.name === "BeggingCreated") {
                            beggingAddress = parsedLog.args.begging;
                            break;
                        }
                    } catch (error) {
                    }
                }
            }

            console.log("beggingAddress: ", beggingAddress)
            BeggingProxy = await ethers.getContractAt("Begging", beggingAddress);
        });
        it("正確簿版", async function () {
            expect(await BeggingProxy.version()).to.equal("1.0.0")
            expect(await BeggingProxy.owner()).to.equal(account1.address)
        })
        it("升級合約", async function () {
            await deployments.fixture(["upgradeBegging"])

            expect(await BeggingProxy.version()).to.equal("2.0.0")
            expect(await BeggingProxy.owner()).to.equal(account1.address)
        })
    })

    describe("測試捐款功能", () => {
        it("正常捐款", async function () {
            expect(await BeggingProxy.connect(account2).donate("account2 notes!", 999, ethers.ZeroAddress, { value: 10 })).to.emit(BeggingProxy, "DonationReceived").withArgs(account2.address, ethers.ZeroAddress, 10)
        })

        it("不在正確時間捐款", async function () {
            await twoDaysLater();
            expect(await BeggingProxy.connect(account2).donate("account2 wrong notes!", 999, ethers.ZeroAddress, { value: 10 })).to.be.revertedWith("this begging had already ended!")
        })

        it("沒有捐款金額", async function () {
            expect(await BeggingProxy.connect(account2).donate("account2 no donation amount", 999, ethers.ZeroAddress)).to.be.revertedWith("no donation amount detected")
        })
    })

    describe("測試取款功能", () => {
        it("正常ETH取款", async function () {
            await BeggingProxy.connect(account2).donate("account2 donation", 999, ethers.ZeroAddress, { value: 10 })
            await BeggingProxy.connect(account2).withdraw()
        })
        it("正常USDC取款", async function () { })
        it("非擁有者要取款", async function () {
            await BeggingProxy.connect(account2).donate("account2 donation", 999, ethers.ZeroAddress, { value: 10 })
            expect(await BeggingProxy.connect(account2).withdraw()).to.be.reverted
        })
    })

    describe("測試檢視功能", () => {
        beforeEach(async function () {
            await BeggingProxy.connect(account2).donate("account2 notes!", 999, ethers.ZeroAddress, { value: 10 })
            await BeggingProxy.connect(account3).donate("account3 notes!", 999, ethers.ZeroAddress, { value: 20 })
        })

        it("正常捐款金額顯示", async function () {
            expect(await BeggingProxy.getDonation(account2.address)).to.equal(10);
            expect(await BeggingProxy.getDonation(account3.address)).to.equal(20);

            await BeggingProxy.connect(account2).donate("account2 notes!", 999, ethers.ZeroAddress, { value: 10 })
            expect(await BeggingProxy.getDonation(account2.address)).to.equal(20);
        })
    })

    async function twoDaysLater() {
        await time.increase(2 * 24 * 60 * 60);
    }
})