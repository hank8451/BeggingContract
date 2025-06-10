const { ethers, upgrades } = require("hardhat")
const fs = require("fs")
const path = require("path")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { save } = deployments;
    const [deployer] = await ethers.getSigners();
    console.log("升級用戶地址:", await deployer.getAddress())

    const storePath = path.resolve(__dirname, "./.cache/beggingFactory.json")
    const storeData = fs.readFileSync(storePath, "utf-8")
    const { factoryAddress, abi } = JSON.parse(storeData)
    console.log("工廠合約地址: ", factoryAddress)
    const factory = await ethers.getContractAt("BeggingFactory", factoryAddress);
    console.log("工廠合約擁有者:", await factory.owner());

    const currentImpl = await factory.getImplementation();
    console.log("現在目標合約地址:", currentImpl);

    const BeggingV2 = await ethers.getContractFactory("BeggingV2")
    const newImplemention = await BeggingV2.deploy();
    await newImplemention.waitForDeployment();
    const newImplAddress = await newImplemention.getAddress()
    console.log("新的目標合約地址：", newImplAddress)

    const upgrade = await factory.upgradeBeacon(newImplAddress);
    await upgrade.wait();

    await save("BeggingV2", {
        abi,
        address: newImplAddress,
    })
    // const storePath = path.resolve(__dirname, "./.cache/proxyBegging.json")
    // const storeData = fs.readFileSync(storePath, "utf-8")
    // const { proxyAddress, implAddress, abi } = JSON.parse(storeData)

    // // 升級
    // const BeggingV2 = await ethers.getContractFactory("BeggingV2")

    // const BeggingProxyV2 = await upgrades.upgradeProxy(proxyAddress, BeggingV2)
    // await BeggingProxyV2.waitForDeployment()
    // const proxyAddressV2 = await BeggingProxyV2.getAddress()

    // await save("BeggingProxyV2", {
    //     abi,
    //     address: proxyAddressV2,
    // })
}

module.exports.tags = ["upgradeBegging"]