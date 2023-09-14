import React, { useState, useEffect } from 'react';
//import Web3 from 'web3';
import { ethers } from 'ethers';
import ABI from  "./raffle.json";
import './App.css';
import { wait } from '@testing-library/user-event/dist/utils';





const App = () => {
  const address = '0xF5b814fE110D1c33e8b2c50f3014A2d8B3f030c4';
  
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  // const [raffleOpen, setRaffleOpen] = useState(true);
  // const [winnerPicked, setWinnerPicked] = useState(false);
  // const [loading, setLoading] = useState(false);
const[winner,setwinner]=useState('');
const [metamask, setMetamask] = useState(false);
const[players,setPlayers]=useState('');
// const[randomGenerated,setRandomGenerated]=useState(false);
// const [winnerPicked, setWinnerPicked] = useState(false);
const[poolFund,setPoolFund]=useState(0);



  useEffect(() => {         //contract & wallet initialization; used ether.js
    const initialize = async () => {
      if (window.ethereum && metamask) {
        
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(address, ABI.abi, signer);
        setContract(contract);

        const wallet=await signer.getAddress();
        setWalletAddress(wallet);
        updtateBalance();
       
       
        
        window.ethereum.on('accountsChanged', (accounts) => {
        setWalletAddress(accounts[0]);
        updtateBalance();
       } 
          );
        
       
      
        

        const balInWei = await provider.getBalance(address);
        const balInEther = ethers.utils.formatEther(balInWei);
        setPoolFund(balInEther);
       
        // getPlayers();



       
        
      }
    };

    initialize();
  }, [metamask]);


  const updtateBalance = async () => {
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer =   provider.getSigner();
    const balInWei = await signer.getBalance();
    const balInEther = ethers.utils.formatEther(balInWei);
    setBalance(balInEther);}
    catch(error){
      console.error('Error getting balance:', error);
    }
  }
  
  const walletCheck = async () => {        //check wallet exist?
    if (window.ethereum) {
      setMetamask(true);
    } else {
      alert('MetaMask not installed!');
    }
  };

  const getPlayers=async()=>{
    try {
      
      const playersObj = await contract.getPlayersList();
      wait();
      setPlayers(playersObj);
  
      
  }catch(error){
    console.error('Error getting players:', error);
  }
  };
 getPlayers();
 

  const enterRaffle = async () => {

    const entranceFee=0.001;

    try {

      const tx =await contract.enterRaffle({
        value: ethers.utils.parseEther(entranceFee.toString()), // Convert the entranceFee to Wei
      });

      await tx.wait();
      getPlayers();
      console.log('Successfully entered the raffle!');
      const balInWei = await provider.getBalance(address);
        const balInEther = ethers.utils.formatEther(balInWei);
        setPoolFund(balInEther);

    } catch (error) {
      console.error('Error entering raffle:', error);
     
    }
    
  };



  
  const pickWinner = async () => {

    try {
      setwinner('');
      const requestId = await contract.initializeVRF();
      await requestId.wait();
      console.log('Random number requested to chainlink vrf with :', requestId);
      setTimeout(async () => {
        try {
          const win = await contract.announceWinner();
          setwinner(win.toString());
          console.log('Winner:', win.toString());
        } catch (error) {
          console.error('Error getting the winner:', error);
        }
      }, 25000);
    } catch (error) {
      console.error('Error picking the winner:', error);
    }
    
   
    
  
  
  };

const distributePrize=async()=>{
  await contract.distributePrize();
}
 

const reset= async()=>{
  try{await contract.resetRaffle();}catch(error){console.error("reset fail",error);
  const balInWei = await provider.getBalance(address);
        const balInEther = ethers.utils.formatEther(balInWei);
        setPoolFund(balInEther);
}
}



  return (

    <div>
          
        {!metamask ? (
          <button id="button-metamask" onClick={walletCheck}>
            Connect Wallet
          </button>
        ) : (
          <button id="button-metamask2" onClick={() => setMetamask(false)}>
            Disconnect
          </button>
        )}
      


          <p className='para'>Connected Wallet Address: {walletAddress}</p>
          <p className='para'>Wallet Balance: {balance} ETH</p>
          {/* <p>Raffle Entrance Fee: {entranceFee} ETH</p> */}
          <p>current win prize : {poolFund}</p>
          <button id="raffle" onClick={enterRaffle} >
            Enter Raffle
          </button>
          <button id="raffle"onClick={pickWinner} >
            Pick Winner
          </button>
          
          <h3 className='para' >winner is {winner}</h3>
          <button onClick={distributePrize}>distribute prize</button>
          <button id="raffle"onClick={reset}>reset all</button>
          

          <h1>Players List</h1>
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(players).map(([index, address]) => (
            <tr key={index}>
              <td>{index}</td>
              <td>{address}</td>
            </tr>
          ))}
        </tbody>
      </table>  
        
     
    </div>
  );
};

export default App;
