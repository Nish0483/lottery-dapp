import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI from './raffle.json';
import './App.css';
import Modal from 'react-modal';
Modal.setAppElement('#root');

const App = () => {
  const address = '0x13d6fB99a3d9c5727c0B0D3b3E9184Df5A5FAb67';

  const [contract, setContract] = useState(null);
 
  const [provider, setProvider] = useState(null);
  
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [winner, setWinner] = useState('');
  const [metamask, setMetamask] = useState(false);
  const [players, setPlayers] = useState('');
  const [poolFund, setPoolFund] = useState(0);
  const [isWinnerModalVisible, setWinnerModalVisible] = useState(false);
  const [isWinnerPending, setWinnerPending] = useState(false);
  const [eventReceived, setEventReceived] = useState(false);
  

  const showWinnerModal = () => {
    setWinnerModalVisible(true);
  };

  const hideWinnerModal = () => {
    setWinnerModalVisible(false);
  };


  useEffect(() => {
    const initialize = async () => {
      if (window.ethereum && metamask) {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(address, ABI, signer);
        setContract(contract);
  
        const wallet = await signer.getAddress();
        setWalletAddress(wallet);
        updtateBalance();
        

        window.ethereum.on('accountsChanged', (accounts) => {
          setWalletAddress(accounts[0]);
          updtateBalance();
        });
      }
      
    };

    initialize();
   
    
  }, [metamask]);




  useEffect( () => {
    const handleFulfill = (rand,index,winner) => {
      console.log('Received random num:', rand.toString());
      console.log('which mod t0 player numbers give index  :', index.toString());
      console.log('and winner of index is :', winner.toString());
      setEventReceived(true);
    };

    if (contract) {
      contract.on('fulfill', handleFulfill);

      return () => {
        // Cleanup the event listener when the component unmounts
        contract.off('fulfill', handleFulfill);
        setEventReceived(false);
      };
    }
  }, [contract]);




  
  const getPlayers = async () => {
  try{
      const playersObj = await contract.getPlayersList();
      setPlayers(playersObj);
      const w=await contract.winner();
      setWinner(w)}catch(error){}
   
      
    
    
  };

  const updtateBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const balInWei = await signer.getBalance();
      const balInEther = ethers.utils.formatEther(balInWei);
      setBalance(balInEther);
     
      
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const walletCheck = async () => {
    if (window.ethereum) {
      setMetamask(true);
    } else {
      alert('MetaMask not installed!');
    }
  };

  useEffect(()=>{
    getPlayers();
  })

 
  

  const enterRaffle = async () => {
    const entranceFee = 0.001;

    try {
      const tx = await contract.enterRaffle({
        value: ethers.utils.parseEther(entranceFee.toString()), 
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
      setWinner('');
      const requestId = await contract.initializeVRF();
      await requestId.wait();
      console.log('Random number requested to chainlink vrf with:', requestId);
      // Wait for the Chainlink VRF fulfillment event
    if (eventReceived) {
      showWinnerModal();
      setWinnerPending(true);

    // Get the winner from the contract
    const tx = await contract.winner();
    setWinner(tx);
    console.log("winner is ", winner);  // Adjust the delay as needed
    }

    

    } catch (error) {
      console.error('Error picking the winner:', error);
    } finally {
      setWinnerPending(false);
      hideWinnerModal();
    }
  };
  

  const distributePrize = async () => {
    await contract.distributePrize();
  };

  const reset = async () => {
    try {
      await contract.resetRaffle();
    } catch (error) {
      console.error('Reset fail', error);
      const balInWei = await provider.getBalance(address);
      const balInEther = ethers.utils.formatEther(balInWei);
      setPoolFund(balInEther);
    }
  };

  return (
    <div className="container">
      <h1>Smart contract lottery</h1>
      <h2>Test Instructions</h2>
      <p>
        Connect wallet in sepolia testnet. Enter Raffle. Winner picking can be
        obtained over automation or manually. The pick winner function is
        supposed to be owner only, but for the test, anyone can use. The result
        will take approximately 30 seconds to display as it's time-consuming
        from chainlink VRF.
      </p>

      {!metamask ? (
        <button id="button-metamask" onClick={walletCheck}>
          Connect Wallet
        </button>
      ) : (
        <button id="button-metamask2" onClick={() => setMetamask(false)}>
          Disconnect
        </button>
      )}

      <p className="para">Connected Wallet Address: {walletAddress}</p>
      <p className="para">Wallet Balance: {balance} ETH</p>
      <p>Current win prize: {poolFund}</p>
      <button id="raffle" onClick={enterRaffle}>
        Enter Raffle
      </button>
      <button id="raffle" onClick={pickWinner}>
        Pick Winner
      </button>

      
      <button onClick={distributePrize}>Distribute Prize</button>
      <button id="reset" onClick={reset}>
        Reset All
      </button>

      <h3>Players List</h3>
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


      <Modal
        isOpen={isWinnerModalVisible}
        onRequestClose={hideWinnerModal}
        className="modal"
        overlayClassName="modal-overlay"
        contentLabel="Winner Modal"
      >
        {isWinnerPending ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Announcing Winner...</p>
          </div>
        ) : (
          <div className="modal-content">
            <p>Winner is {winner}</p>
            <button onClick={hideWinnerModal}>Close</button>
          </div>
        )}
      </Modal>

      <p>Last winner is {winner} </p>
      

    </div>
  );
};

export default App;
