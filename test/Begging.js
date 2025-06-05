const { expect } = require("chai");
const hre = require('hardhat');
const {
    time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Begging", function () {
    const { ethers } = hre;
    const DAYTIMESTART = 0;
    const DAYTIMEEND = 9;
    let account1, account2, account3, account4, deployer;
    let BeggingContract;

    beforeEach(async function () {
        [account1, account2, account3, account4, deployer] = await ethers.getSigners();
        const Begging = await ethers.getContractFactory("Begging");
        BeggingContract = await Begging.connect(deployer).deploy();
        BeggingContract.waitForDeployment();
    });

    describe("測試捐款功能", () => {
        it("正常捐款", async function () {
            await setToDayTime()
            await expect(BeggingContract.connect(account1).donate("account1 notes!", { value: 10 })).to.emit(BeggingContract, "Donation").withArgs(account1.address, 10)
        })

        it("不在正確時間捐款", async function () {
            await setToNightTime()
            await expect(BeggingContract.connect(account1).donate("account1 wrong notes!", { value: 10 })).to.be.revertedWith("Function can only be called during daytime")
        })

        it("沒有捐款金額", async function () {
            await setToDayTime()
            await expect(BeggingContract.connect(account1).donate("account1 no donation amount")).to.be.revertedWith("no donation")
        })
    })

    describe("測試取款功能", () => {
        beforeEach(async function () {
            await BeggingContract.connect(account1).donate("account1 notes!", { value: 10 })
            await BeggingContract.connect(account2).donate("account2 notes!", { value: 20 })
            await BeggingContract.connect(account3).donate("account3 notes!", { value: 30 })
            await BeggingContract.connect(account4).donate("account4 notes!", { value: 40 })
        })

        it("正常取款", async function () {
            await BeggingContract.connect(deployer).withdraw()
        })
        it("非擁有者要取款", async function () {
            await expect(BeggingContract.connect(account1).withdraw()).to.be.reverted
        })
        it("沒有餘額可以取款", async function () {
            await BeggingContract.connect(deployer).withdraw()
            await expect(BeggingContract.connect(deployer).withdraw()).to.be.revertedWith("No money to withdraw")
        })

    })

    describe("測試檢視功能", () => {
        beforeEach(async function () {
            await BeggingContract.connect(account1).donate("account1 notes!", { value: 10 })
            await BeggingContract.connect(account2).donate("account2 notes!", { value: 20 })
        })

        it("正常捐款金額顯示", async function () {
            expect(await BeggingContract.getDonation(account1.address)).to.equal(10);
            expect(await BeggingContract.getDonation(account2.address)).to.equal(20);

            await BeggingContract.connect(account1).donate("account1 notes!", { value: 10 })
            expect(await BeggingContract.getDonation(account1.address)).to.equal(20);
        })
    })

    describe("測試捐款排行", () => {
        it("正常捐款排行", async function () {
            let first, second, third;
            let donatations = [
                { donator: account1, value: 10, ranking: [account1.address, ethers.ZeroAddress, ethers.ZeroAddress] }, // account1: 10
                { donator: account2, value: 20, ranking: [account2.address, account1.address, ethers.ZeroAddress] },   // account2: 20, account1: 10
                { donator: account1, value: 20, ranking: [account1.address, account2.address, ethers.ZeroAddress] },   // account1: 30, account2: 20
                { donator: account3, value: 40, ranking: [account3.address, account1.address, account2.address] },     // account3: 40, account1: 30, account2: 20
                { donator: account2, value: 30, ranking: [account2.address, account3.address, account1.address] },     // account2: 50, account3: 40, account1: 30
                { donator: account4, value: 60, ranking: [account4.address, account2.address, account3.address] },     // account4: 60, account2: 50, account3: 40, account1: 30
                { donator: account1, value: 40, ranking: [account1.address, account4.address, account2.address] },     // account1: 80, account4: 60, account2: 50, account3: 40
            ]

            for (let i = 0; i < donatations.length; i++) {
                const donation = donatations[i]
                await BeggingContract.connect(donation.donator).donate("", { value: donation.value });
                [first, second, third] = await BeggingContract.getTopThreeDonator();
                expect(first).to.equal(donation.ranking[0]);
                expect(second).to.equal(donation.ranking[1]);
                expect(third).to.equal(donation.ranking[2]);
            }
        })
    })

    async function setToDayTime() {
        let currentTime = await time.latest();
        let currentHour = (currentTime / 3600) % 24;
        while (currentHour < DAYTIMESTART || currentHour >= DAYTIMEEND) {
            await time.increase(2 * 60 * 60);
            currentTime = await time.latest();
            currentHour = (currentTime / 3600) % 24;
        }
    }

    async function setToNightTime() {
        let currentTime = await time.latest();
        let currentHour = (currentTime / 3600) % 24;
        while (currentHour >= DAYTIMESTART && currentHour < DAYTIMEEND) {
            await time.increase(2 * 60 * 60);
            currentTime = await time.latest();
            currentHour = (currentTime / 3600) % 24;
        }
    }

})