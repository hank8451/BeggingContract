const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BeggingModule", (m) => {
    const begging = m.contract("Begging")

    return { begging };
})