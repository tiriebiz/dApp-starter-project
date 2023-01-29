import './App.css';

import React, {useEffect, useState} from "react";
import {ethers} from "ethers";
import abi from "./utils/WavePortal.json";

import logo from "./assets/img/logo.svg";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [msgValue, setMsgValue] = useState("");
  const [allWaves, setAllWaves] = useState([]);

  // v0.1.0
  //const contractAddress = '0x4E44fCe3F1A69409FecaF3573B920a9fdB49A5fE';
  // v0.1.1
  //const contractAddress = '0xc48D4f0Da6528CEfe234484d81abd1659E8fb2d8';
  // v0.1.2
  const contractAddress = '0x1613d880D3Cf61f695Ba2c1fe99b1157c41712B9';
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();
        console.log("weves", waves);
        /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            msg: wave.msg,
          };
        });
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let contractBalance = await provider.getBalance(wavePortalContract.address);
        console.log("Contract balance:", ethers.utils.formatEther(contractBalance));

        const waveTxn = await wavePortalContract.wave(msgValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let contractBalance_post = await provider.getBalance(
          wavePortalContract.address
        );
        if (contractBalance_post.lt(contractBalance)) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        console.log(
          "Contract balance after wave:",
          ethers.utils.formatEther(contractBalance_post)
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, msg) => {
      console.log("NewWave", from, timestamp, msg);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          msg: msg,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  /* window.ethereumにアクセスできることを確認します */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認します */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };
  // connectWalletメソッドを実装
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  return (
  <div className="appContainer">
    <header>
      <img className="logo" src={logo} />
    </header>
    <main className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="hand-wave">👋</span> WELCOME to the 1st dApp!<br /> - Wave Portal -!
        </div>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
           <p>Wallet Connected.</p>
        )}

        <div className="bio">
        メッセージを入力して、<span role="img" aria-label="hand-wave">👋</span>を送ってください<span role="img" aria-label="shine">✨</span>
        </div>

        {currentAccount && (
         <div className="messageForm">
           <textarea
            name="msgArea"
            placeholder="input message."
            type="text"
            id="msg"
            value={msgValue}
            onChange={(e) => setMsgValue(e.target.value)}
           />
          <button className="waveButton" onClick={wave}>
          Wave at Me 👋
          </button>
         </div>
        )}
        {currentAccount && allWaves.length > 0 && (
          <h3>
          History
          </h3>
        )}
        {currentAccount &&
          allWaves
            .reverse()
            .map((wave, index) => {
              return (
                <div
                  key={index}
                  className="history-item"
                >
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.msg}</div>
                </div>
              );
            }
        )}
      </div>
    </main>
    <footer>
      <p className="copyright">© Goeswell Co., Ltd. All Rights Reserved.</p>
    </footer>
  </div>
  );
}
