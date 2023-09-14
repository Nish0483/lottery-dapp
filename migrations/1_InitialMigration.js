const x= artifacts.require("lottery");
module.exports=function(deployer)
{
    deployer.deploy(x);
}