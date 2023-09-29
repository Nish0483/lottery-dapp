// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { VRFCoordinatorV2Interface } from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import { VRFConsumerBaseV2 } from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract raffle is VRFConsumerBaseV2 {

    bool raffleOpen= true;
    
    address payable[] private players;
    VRFCoordinatorV2Interface private vrf;
    bytes32 private  keyHash;
    uint64 private subId;
    uint16 private minimumRequestConfirmations;
    uint32 private callbackGasLimit;
    uint32 private numWords;
    uint256 public requestId ;
    uint public random;
    uint public entranceFee;
    address payable public  winner;
    uint public NoOfPlayers;
    uint public prize=(address(this).balance) * 90 / 100;
    address payable  public owner;
    uint public interval ;
    bool winnerPicked=false;
    bool public randomGenerated= false;
    


    constructor() VRFConsumerBaseV2(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625) {
        vrf = VRFCoordinatorV2Interface(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625);
        keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
        subId = 5609;
        minimumRequestConfirmations = 3; 
        callbackGasLimit = 2500000;
        numWords = 1;
        entranceFee= 0.001 ether;
        owner =payable(msg.sender);
       
    }
    
    function enterRaffle() public payable {
        
         if (raffleOpen!=true) {
            revert ("RaffleNotOpen");
         }
         if(msg.value!=entranceFee){
            revert ("EntranceFeeNotMet");
         }
        players.push(payable(msg.sender));
        NoOfPlayers=players.length;
        
        
    }

    function getPlayersList() public view returns(address[] memory){
        address[] memory playersList = new address[](players.length);
         for (uint256 i = 0; i < players.length; i++) 
         {
        playersList[i] = players[i];
        }
        return playersList;
    }

  

    function initializeVRF() public returns (uint256) 
    {

      require(NoOfPlayers>1,"not enoght players");
      
      raffleOpen=false;
       requestId = vrf.requestRandomWords(
            keyHash,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords
        );

        
        return requestId;
        
    }

  
 event fulfill(uint256 rand,uint index , address winner);
    function fulfillRandomWords (uint256 , uint256[] memory randomWords) internal override  {
        random=randomWords[0];
        randomGenerated=true;
        uint256 index=random % (players.length);
        winner=players[index];
        winnerPicked=true;
        emit fulfill(random,index,winner);
        }
  





    function announceWinner() public view returns(address)
    {   
        //require(randomGenerated==true,"fail to gen random");
       
        return(winner);
        
    }


  function distributePrize() public{
        require(raffleOpen==false,"Raffle still running");
        require(winnerPicked==true,"winner not picked yet");
        prize = (address(this).balance) * 90 / 100;
        bool success = false;

        // Send the prize to the winner address
        (success, ) = winner.call{value: prize}("");
        require(success, "Failed to send prize to the winner");

        // Send the remaining balance to the owner
        bool ok = owner.send(address(this).balance);
        require(ok, "Failed to send remaining balance to the owner");
        resetRaffle();
        

  }
    
    
   

   
   function resetRaffle () public{
       
      
       raffleOpen=true;
       winnerPicked=false;
       NoOfPlayers=0;
       delete players;
       winner=payable(0);
       

      
   }
}