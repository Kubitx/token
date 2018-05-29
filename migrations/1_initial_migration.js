var Migrations = artifacts.require('./Migrations.sol');

module.exports = async function (deployer) {
  var args = [];
  console.log(args);
  var params = [web3, Migrations.bytecode, Migrations.abi].concat(args);
  var gas = 
  var deployArgs = [Migrations].concat(args);
  deployArgs.push({ gas: gas });
  deployer.deploy.apply(deployer, deployArgs);
};
