const socket = io();
let localStream;
let peerConnection;

const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;

    peerConnection = new RTCPeerConnection(servers);

    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = event => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };

    peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => socket.emit("offer", peerConnection.localDescription));
});

socket.on("offer", offer => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer()
    .then(answer => peerConnection.setLocalDescription(answer))
    .then(() => socket.emit("answer", peerConnection.localDescription));
});

socket.on("answer", answer => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", candidate => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});


// ---------- LOCATION SHARING ----------

let map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;

$("#shareLocation").click(function () {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        socket.emit("location", { lat, lon });
        showLocation(lat, lon);
    });
});

socket.on("location", data => {
    showLocation(data.lat, data.lon);
});

function showLocation(lat, lon) {
    map.setView([lat, lon], 13);

    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon]).addTo(map);
    }

    L.Control.Geocoder.nominatim().reverse(
        { lat: lat, lng: lon }, 
        map.options.crs.scale(map.getZoom()), 
        results => {
            if (results.length > 0) {
                $("#address").text("Address: " + results[0].name);
            }
        }
    );
}
