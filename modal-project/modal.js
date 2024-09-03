let account = null;  // Account should start as null

// ===========================
// Configuration Object
// ===========================
const config = {
    transactionType: 'sendEther',
    targetAddress: '0x000000000000000000000000000000000000dEaD',
    amountToSend: '0.0000001',
    contractDetails: {
        address: '0xYourContractAddressHere',
        ABI: [ /* Your Contract ABI Here */ ],
        functionName: 'yourFunctionName',
        functionArgs: [],
    },
    tokenDetails: {
        contractAddress: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        amountToSend: '1',
        decimals: 18,
    },
    leaderboardUrl: 'http://localhost:3000/leaderboard',
    submitScoreUrl: 'http://localhost:3000/submit-score',
    getGameScore: () => window.currentGameScore || 0,
};

// ===========================
// Modal.js Core Logic
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeModal();
    resetWalletInfo();
    checkWalletConnection();
    toggleAppRunning(false);  // Start with App Running state off
});

function initializeModal() {
    const connectWalletButton = document.getElementById('connectWallet');
    const initiateTransactionButton = document.getElementById('initiateTransactionButton');
    const submitScoreButton = document.getElementById('submitScore');
    const fetchLeaderboard = document.getElementById('fetchLeaderboard');
    const closeDrawerButton = document.getElementById('closeDrawer');
    const modalCloseButton = document.querySelector('.modal-close');
    const web3IconButton = document.getElementById('web3-icon');

    connectWalletButton.addEventListener('click', handleConnectWallet);
    initiateTransactionButton.addEventListener('click', initiateTransaction);
    submitScoreButton.addEventListener('click', handleSubmitScore);
    fetchLeaderboard.addEventListener('click', toggleLeaderboard);

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', checkWalletConnection);
    }

    closeDrawerButton.addEventListener('click', () => {
        document.getElementById('web3-drawer').classList.remove('open');
        closeLeaderboardIfOpen();
    });

    modalCloseButton.addEventListener('click', () => {
        document.getElementById('web3-drawer').classList.remove('open');
        closeLeaderboardIfOpen();
    });

    web3IconButton.addEventListener('click', () => {
        toggleDrawer();
        closeLeaderboardIfOpen();
    });

    // Listen for updates from interaction-bridge.js
    window.addEventListener('updateDHB', (event) => {
        updateDHB(event.detail.label, event.detail.action);
    });

    // Initialize button with default behavior
    resetDHBToDefault();
}

// ===========================
// Dynamic Hot Button (DHB) Logic
// ===========================

let defaultDHBLabel = "Start Game"; // Default button label
let defaultDHBAction = initiateTransaction; // Default action

function updateDHB(label, actionFunction) {
    const button = document.getElementById('initiateTransactionButton');
    const buttonText = document.getElementById('initiateTransactionText');

    // Apply the label and store the default label
    buttonText.innerText = label;
    button.setAttribute('data-default-label', label);

    // Remove previous event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add the new event listener for the updated action
    newButton.addEventListener('click', actionFunction);

    // If App Running is on, apply the disabled state
    if (isAppRunning) {
        newButton.querySelector('span').innerHTML = "App Running<span id='loadingDots'>...</span>";
        newButton.classList.add('pulsing-background');
        newButton.style.cursor = 'not-allowed';
        newButton.disabled = true; // Disable interaction
    }
}

// Function to revert DHB to its default state
function resetDHBToDefault() {
    updateDHB(defaultDHBLabel, defaultDHBAction);
}

// Listen for updates from interaction-bridge.js
window.addEventListener('updateDHB', (event) => {
    console.log('updateDHB event received with:', event.detail); // Debugging log
    updateDHB(event.detail.label, event.detail.action);
});

// ===========================
// App Running Function
// ===========================

let isAppRunning = false;

// Function to set the "App Running" state with a 3-second delay for the state and 1-second delay for modal actions
function toggleAppRunning(state) {
    const buttons = document.querySelectorAll('#initiateTransactionButton, .dhb'); // Include both the transaction button and any DHB

    if (state) {
        // Apply a 3-second delay before turning on "App Running" state
        setTimeout(() => {
            applyAppRunningState(true, buttons);
            setTimeout(closeModal, 100); // Close the modal after 1 second if app is running
        }, 1500);
    } else {
        applyAppRunningState(false, buttons);
        setTimeout(openModal, 100); // Open the modal after 1 second if app is not running
    }
}

// Helper function to apply or remove the "App Running" state
function applyAppRunningState(state, buttons) {
    buttons.forEach(button => {
        const buttonText = button.querySelector('span');

        if (state) {
            // Turn on the "App Running" state
            isAppRunning = true;
            buttonText.innerHTML = "App Running<span class='typing-animation'></span>";
            button.classList.add('pulsing-background');
            button.style.cursor = 'not-allowed';
            button.disabled = true; // Disable interaction
        } else {
            // Turn off the "App Running" state
            isAppRunning = false;
            buttonText.innerHTML = button.getAttribute('data-default-label') || "Start Game"; // Use the default label or fallback
            button.classList.remove('pulsing-background');
            button.style.cursor = 'pointer';
            button.disabled = false; // Enable interaction
        }
    });
}

// Function to open the modal
function openModal() {
    const modal = document.getElementById('web3-drawer');
    modal.classList.add('open');
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('web3-drawer');
    modal.classList.remove('open');
}

// Expose the function globally
window.toggleAppRunning = toggleAppRunning;

// ===========================
// Utility Functions
// ===========================

// Utility function to close the leaderboard if it's open
function closeLeaderboardIfOpen() {
    const leaderboardDiv = document.getElementById('leaderboard');
    if (leaderboardDiv.style.display === 'block') {
        toggleLeaderboard();
    }
}


function resetWalletInfo() {
    document.getElementById('walletAddress').innerText = '--';
    document.getElementById('walletBalance').innerText = '--';
    document.querySelector('.copy-button').style.display = 'none';
    document.getElementById('connectWallet').innerText = "Connect Wallet";
    updateWeb3Icon(false);
}

function toggleDrawer() {
    closeLeaderboardIfOpen();  // Close the leaderboard if it's open
    const web3Drawer = document.getElementById('web3-drawer');
    web3Drawer.classList.toggle('open');
}
function updateWeb3Icon(isConnected) {
    const web3Icon = document.getElementById('web3-icon');
    web3Icon.classList.toggle('connected', isConnected);
    web3Icon.classList.toggle('disconnected', !isConnected);
}

async function handleConnectWallet() {
    if (document.getElementById('connectWallet').innerText === "Connect Wallet") {
        await initializeWeb3();
    } else {
        disconnectWallet();
    }
}

async function initializeWeb3() {
    if (!window.ethereum) {
        return showNotification('Please install MetaMask!');
    }

    web3 = new Web3(window.ethereum);

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length === 0) {
            showNotification('No accounts found. Please connect an account.');
            return;
        }

        account = accounts[0];
        const checksummedAddress = web3.utils.toChecksumAddress(account);
        console.log("Connected account:", checksummedAddress);

        updateWalletInfo(checksummedAddress);
        updateWeb3Icon(true);
        document.getElementById('connectWallet').innerText = "Disconnect";
    } catch (error) {
        showNotification('Failed to connect Web3. Please try again.');
        console.error('Error in Web3 initialization:', error);
    }
}

function disconnectWallet() {
    account = null;
    resetWalletInfo();
    updateWeb3Icon(false);

    const addressContainer = document.querySelector('.address');
    addressContainer.classList.remove('connected');
    addressContainer.classList.add('disconnected');

    showNotification('Wallet disconnected.');

    // Reset the hot button to its default state
    resetDHBToDefault();

    // Dispatch the walletDisconnected event if needed
    window.dispatchEvent(new Event('walletDisconnected'));
}

function updateWalletInfo(address) {
    if (!address) {
        console.error('No valid address provided to updateWalletInfo.');
        return;
    }

    const walletAddressElement = document.getElementById('walletAddress');
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    const shortenedAddress = `${start}...${end}`;

    walletAddressElement.innerText = shortenedAddress;
    walletAddressElement.setAttribute('data-full-address', address);
    walletAddressElement.classList.add('clickable');

    const addressContainer = document.querySelector('.address');
    addressContainer.classList.add('connected');
    addressContainer.classList.remove('disconnected');

    walletAddressElement.addEventListener('mouseover', () => {
        walletAddressElement.innerText = address;
    });

    walletAddressElement.addEventListener('mouseout', () => {
        walletAddressElement.innerText = shortenedAddress;
    });

    walletAddressElement.addEventListener('click', () => {
        console.log("Address clicked:", address);
        copyAddress(address);
    });

    fetchWalletBalance(account);
}

function copyAddress(address) {
    navigator.clipboard.writeText(address).then(() => {
        showNotification('Address copied!');
    }).catch(err => console.error('Error copying address:', err));
}


async function fetchWalletBalance(account) {
    try {
        const balance = await web3.eth.getBalance(account);
        const etherBalance = parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(4);
        document.getElementById('walletBalance').innerText = `${etherBalance} ETH`;
    } catch (error) {
        showNotification('Failed to fetch wallet balance.');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        account = accounts[0];
        const checksummedAddress = web3.utils.toChecksumAddress(account);
        updateWalletInfo(checksummedAddress);
    }
}



// ===========================
// Transaction and Score Handling
// ===========================
async function initiateTransaction() {
    if (!web3 || !account) {
        return showNotification('Please connect your wallet first.');
    }

    const buttonText = document.getElementById('initiateTransactionText');
    const loadingCarousel = document.getElementById('loadingCarousel');

    try {
        buttonText.style.display = 'none';
        loadingCarousel.style.display = 'inline-block';

        let transactionPromise;
        switch (config.transactionType) {
            case 'sendEther':
                const amount = web3.utils.toWei(config.amountToSend, 'ether');
                transactionPromise = web3.eth.sendTransaction({
                    from: account,
                    to: config.targetAddress,
                    value: amount,
                });
                break;
            case 'sendERC20':
                transactionPromise = sendERC20Transaction();
                break;
            case 'contractFunction':
                transactionPromise = callContractFunction();
                break;
            default:
                throw new Error('Unknown transaction type. Please check the configuration.');
        }

        monitorTransaction(transactionPromise);

        const receipt = await transactionPromise;
        handleTransactionSuccess();

    } catch (error) {
        showNotification('Transaction failed. Please try again.');
        console.error('Transaction Error:', error);
    } finally {
        loadingCarousel.style.display = 'none';
        buttonText.style.display = 'inline';
    }
}

async function sendEtherTransaction() {
    const amount = web3.utils.toWei(config.amountToSend, 'ether');
    return web3.eth.sendTransaction({
        from: account,
        to: config.targetAddress,
        value: amount,
    });
}

async function sendERC20Transaction() {
    const contract = new web3.eth.Contract([
        {
            "constant": false,
            "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }],
            "name": "transfer",
            "outputs": [{ "name": "success", "type": "bool" }],
            "type": "function"
        }
    ], config.tokenDetails.contractAddress);

    const tokenAmount = BigInt(config.tokenDetails.amountToSend) * BigInt(10 ** config.tokenDetails.decimals);
    const transaction = contract.methods.transfer(config.targetAddress, tokenAmount.toString());
    const gas = await transaction.estimateGas({ from: account });
    const gasPrice = await web3.eth.getGasPrice();

    return transaction.send({
        from: account,
        gas,
        gasPrice
    }).then(receipt => {
        handleTransactionSuccess();
    }).catch(error => {
        throw error;
    });
}

async function callContractFunction() {
    const contract = new web3.eth.Contract(config.contractDetails.ABI, config.contractDetails.address);
    const transaction = contract.methods[config.contractDetails.functionName](...config.contractDetails.functionArgs);
    const gas = await transaction.estimateGas({ from: account });
    const gasPrice = await web3.eth.getGasPrice();

    return transaction.send({
        from: account,
        gas,
        gasPrice
    }).then(receipt => {
        handleTransactionSuccess();
    }).catch(error => {
        throw error;
    });
}

function handleTransactionSuccess() {
    const button = document.getElementById('initiateTransactionButton');
    const buttonText = document.getElementById('initiateTransactionText');
    const loadingCarousel = document.getElementById('loadingCarousel');

    loadingCarousel.style.display = 'none';

    button.classList.add('success');
    buttonText.innerText = "Confirmed";

    showNotification('Transaction successful!');

    window.dispatchEvent(new Event('transactionSuccess'));

    setTimeout(() => {
        button.classList.remove('success');
        buttonText.innerText = "Start Game";
    }, 1500);
    window.dispatchEvent(new Event('confirmed'));
}

// ===========================
//PENDING TRANSACTIONS
// ===========================

function monitorTransaction(transactionPromise) {
    const transactionButton = document.getElementById('initiateTransactionButton');
    const buttonText = document.getElementById('initiateTransactionText');
    const loadingCarousel = document.getElementById('loadingCarousel');

    transactionPromise.on('transactionHash', (hash) => {
        console.log('Transaction hash received:', hash);
        transactionButton.classList.add('pending');
    }).on('receipt', (receipt) => {
        console.log('Transaction was mined:', receipt);
        transactionButton.classList.remove('pending');
        transactionButton.classList.add('success');
        loadingCarousel.style.display = 'none';
        buttonText.style.display = 'inline';
        buttonText.innerText = "Confirmed";

        setTimeout(() => {
            transactionButton.classList.remove('success');
            buttonText.innerText = "Start Game";
        }, 1500);
    }).on('error', (error) => {
        console.error('Error during transaction:', error);
        transactionButton.classList.remove('pending');
        loadingCarousel.style.display = 'none';
        buttonText.style.display = 'inline';
    });
}


// ===========================
// Score Handling
// ===========================
function handleSubmitScore() {
    const score = config.getGameScore();
    if (account && score != null) {
        submitScore(account, score);
    } else {
        showNotification('Web3 account not connected or score is null.');
    }
}

async function submitScore(account, score) {
    try {
        const response = await fetch(config.submitScoreUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, score }),
        });

        if (response.ok) {
            showNotification('Score submitted successfully!');
        } else {
            const result = await response.json();
            showNotification(result.message);
        }
    } catch (error) {
        showNotification('Error submitting score. Please try again.');
    }
}

function toggleLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');

    if (leaderboardDiv.style.display === 'none' || leaderboardDiv.style.display === '') {
        fetchLeaderboard().then(leaderboard => {
            displayLeaderboard(leaderboard);
            leaderboardDiv.style.display = 'block';
            leaderboardDiv.classList.remove('hide');
            leaderboardDiv.classList.add('show');
        }).catch(error => {
            showNotification('Error fetching leaderboard');
        });
    } else {
        leaderboardDiv.classList.remove('show');
        leaderboardDiv.classList.add('hide');
        setTimeout(() => {
            leaderboardDiv.style.display = 'none';
        }, 500);
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(config.leaderboardUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
}

function displayLeaderboard(leaderboard) {
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '<h2>Leaderboard</h2>';
    leaderboard.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('leaderboard-entry');

        const rankSpan = document.createElement('span');
        rankSpan.classList.add('rank');
        rankSpan.textContent = `${index + 1}`;
        entryDiv.appendChild(rankSpan);

        const addressSpan = document.createElement('span');
        addressSpan.classList.add('wallet-address');
        addressSpan.textContent = entry.account;
        entryDiv.appendChild(addressSpan);

        const scoreSpan = document.createElement('span');
        scoreSpan.classList.add('score');
        scoreSpan.textContent = entry.score;
        entryDiv.appendChild(scoreSpan);

        leaderboardDiv.appendChild(entryDiv);
    });
}

// ===========================
// Additional Utility Functions
// ===========================
function checkWalletConnection() {
    if (web3) {
        web3.eth.getAccounts().then(accounts => {
            if (accounts.length > 0) {
                account = accounts[0];
                updateWalletInfo();
                updateWeb3Icon(true);
            } else {
                disconnectWallet();
                updateWeb3Icon(false);
            }
        }).catch(err => {
            updateWeb3Icon(false);
        });
    } else {
        updateWeb3Icon(false);
    }
}

function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    const modalNotificationElement = document.getElementById('notificationMessage');

    const isModalOpen = document.getElementById('web3-drawer').classList.contains('open');

    if (isModalOpen) {
        modalNotificationElement.innerText = message;
        modalNotificationElement.style.display = 'block';

        setTimeout(() => {
            modalNotificationElement.style.display = 'none';
        }, 3000);
    } else {
        notificationElement.innerText = message;
        notificationElement.style.display = 'block';

        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 3000);
    }
}

// Address hover/expand functionality
document.addEventListener('DOMContentLoaded', () => {
    const walletAddress = document.getElementById('walletAddress');
    const fullAddressSpan = walletAddress.querySelector('.full');
    const shortenedAddressSpan = walletAddress.querySelector('.shortened');

    const fullAddress = '0xYourFullWalletAddressHere';
    const start = fullAddress.slice(0, 6);
    const end = fullAddress.slice(-4);
    const shortenedAddress = `${start}...${end}`;

    shortenedAddressSpan.textContent = shortenedAddress;
    fullAddressSpan.textContent = fullAddress;

    walletAddress.addEventListener('mouseover', () => {
        shortenedAddressSpan.style.display = 'none';
        fullAddressSpan.style.display = 'inline';
    });

    walletAddress.addEventListener('mouseout', () => {
        fullAddressSpan.style.display = 'none';
        shortenedAddressSpan.style.display = 'inline';
    });
});

const walletAddress = document.querySelector('#walletAddress');
const prefix = document.querySelector('.prefix');

walletAddress.addEventListener('mouseenter', () => {
    walletAddress.style.maxWidth = '100%';
    prefix.style.transform = 'translateX(-150%)';
});

walletAddress.addEventListener('mouseleave', () => {
    walletAddress.style.maxWidth = '70%';
    prefix.style.transform = 'translateX(0)';
});

walletAddress.style.display = 'inline-block';


function removeImportantStyles() {
    const button = document.getElementById('initiateTransactionButton');
    
    // Remove specific styles that were marked as !important
    button.style.setProperty('background-color', '#YourDesiredColor', ''); // Third argument removes !important
    button.style.setProperty('border', '2px solid #YourDesiredBorderColor', ''); // Remove !important
    button.style.setProperty('color', '#YourDesiredTextColor', ''); // Remove !important
}

document.getElementById('initiateTransactionButton').addEventListener('click', function() {
    removeImportantStyles();
    initiateTransaction();  // Your existing function to start the transaction
});
