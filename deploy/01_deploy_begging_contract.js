const { deployments, upgrades, getNamedAccounts, ethers } = require("hardhat")
const fs = require("fs")
const path = require("path")

module.exports = async () => {
    const { save } = deployments;
    const [deployer] = await ethers.getSigners();

    console.log("部署用戶地址: ", await deployer.getAddress())

    // 1. deploy impl contract
    const Begging = await ethers.getContractFactory("Begging")
    const implementation = await Begging.deploy();
    await implementation.waitForDeployment();
    const implAddress = await implementation.getAddress()
    console.log("目標合約地址: ", implAddress)

    // 2. deploy factory contract
    const BeggingFactory = await ethers.getContractFactory("BeggingFactory")
    const factory = await BeggingFactory.deploy(
        implAddress,
    )
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    const beaconAddress = await factory.beacon();
    console.log("工廠合約地址: ", factoryAddress);
    console.log("Beacon地址: ", beaconAddress);

    const storePath = path.resolve(__dirname, "./.cache/beggingFactory.json")
    fs.writeFileSync(
        storePath,
        JSON.stringify({
            implAddress,
            factoryAddress,
            beaconAddress,
            abi: Begging.interface.format("json"),
            factoryAbi: BeggingFactory.interface.format("json"),
        })
    )

    await save("BeggingFactory", {
        abi: BeggingFactory.interface.format("json"),
        address: factoryAddress
    })

    // const Begging = await ethers.getContractFactory("Begging")
    // const BeggingProxy = await upgrades.deployProxy(Begging, [], {
    //     initializer: "initialize"
    // })
    // await BeggingProxy.waitForDeployment();
    // const proxyAddress = await BeggingProxy.getAddress();
    // console.log("代理合約地址:", proxyAddress)
    // const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress)
    // console.log("目標合約地址:", implAddress)

    // const storePath = path.resolve(__dirname, "./.cache/proxyBegging.json")
    // fs.writeFileSync(
    //     storePath,
    //     JSON.stringify({
    //         proxyAddress,
    //         implAddress,
    //         abi: Begging.interface.format("json"),
    //     })
    // )
    // await save("BeggingProxy", {
    //     abi: Begging.interface.format("json"),
    //     address: proxyAddress
    // })
}

module.exports.tags = ["deployBegging"]