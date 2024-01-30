const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
let localStream;
let remoteStream;
let peerConnection;

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Create an RTCPeerConnection
        peerConnection = new RTCPeerConnection();

        // Add local stream to the peer connection
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // Set up event handlers for the peer connection
        peerConnection.onicecandidate = handleICECandidateEvent;
        peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
        peerConnection.ontrack = handleTrackEvent;

        // Create an offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send the offer to the other user (you'll need a signaling server for this)
        // For simplicity, you can use Firebase Realtime Database for signaling
        const callRef = firebase.database().ref('call');
        callRef.push({
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        });

        // Listen for incoming answers
        callRef.on('child_added', (snapshot) => {
            const answer = snapshot.val().answer;
            handleAnswer(answer);
        });
    } catch (error) {
        console.error('Error starting call:', error);
    }
}

function endCall() {
    // Close the peer connection and stop local stream
    if (peerConnection) {
        peerConnection.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
        // Send the candidate to the other user
        // For simplicity, you can use Firebase Realtime Database for signaling
        const callRef = firebase.database().ref('call');
        callRef.push({
            iceCandidate: event.candidate
        });
    }
}

function handleICEConnectionStateChangeEvent(event) {
    console.log('ICE Connection State:', peerConnection.iceConnectionState);
}

function handleTrackEvent(event) {
    // Display the remote stream
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

async function handleAnswer(answer) {
    // Set the remote description with the received answer
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Set up Firebase
const firebaseConfig = {
   apiKey: "AIzaSyDol5ogEXjyxmziO0gFZ_ZQD-ZMF6FolHw",
  authDomain: "whatsapp-clone-e8e52.firebaseapp.com",
  projectId: "whatsapp-clone-e8e52",
  storageBucket: "whatsapp-clone-e8e52.appspot.com",
  messagingSenderId: "62720525194",
  appId: "1:62720525194:web:cccdaf9cca9adc09067e73"
};
firebase.initializeApp(firebaseConfig);
