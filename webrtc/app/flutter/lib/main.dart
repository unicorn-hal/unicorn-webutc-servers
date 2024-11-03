import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'Flutter WebRTC Demo',
        home: WebRTCSample(),
        debugShowCheckedModeBanner: false);
  }
}

class WebRTCSample extends StatefulWidget {
  @override
  _WebRTCSampleState createState() => _WebRTCSampleState();
}

class _WebRTCSampleState extends State<WebRTCSample> {
  late RTCPeerConnection _peerConnection;
  late MediaStream _localStream;
  late WebSocketChannel _channel;
  final _remoteRenderer = RTCVideoRenderer();
  final _localRenderer = RTCVideoRenderer();
  List<String> _peers = [];
  String? _selectedPeer;

  @override
  void initState() {
    super.initState();
    _initRenderers();
    _connectToSignalingServer();
    _createPeerConnection().then((pc) {
      _peerConnection = pc;
      _startLocalStream();
    });
  }

  @override
  void dispose() {
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    _peerConnection.close();
    _channel.sink.close();
    super.dispose();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  Future<void> _startLocalStream() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': {
        'facingMode': 'user',
      }
    };

    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    _localRenderer.srcObject = _localStream;

    _localStream.getTracks().forEach((track) {
      _peerConnection.addTrack(track, _localStream);
    });
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    final Map<String, dynamic> configuration = {
      'iceServers': [
        {'urls': 'stun:192.168.40.249:3478'},
      ],
    };

    final pc = await createPeerConnection(configuration);

    pc.onIceCandidate = (RTCIceCandidate candidate) {
      if (candidate != null) {
        _sendSignalingMessage({
          'type': 'candidate',
          'candidate': candidate.toMap(),
        });
      }
    };

    pc.onTrack = (RTCTrackEvent event) {
      if (event.track.kind == 'video') {
        setState(() {
          _remoteRenderer.srcObject = event.streams.first;
        });
      }
    };

    return pc;
  }

  void _connectToSignalingServer() {
    _channel = WebSocketChannel.connect(Uri.parse('ws://192.168.40.249:3000'));

    _channel.stream.listen((message) {
      String messageString;

      if (message is String) {
        messageString = message;
      } else if (message is Uint8List) {
        messageString = utf8.decode(message);
      } else {
        print('Unsupported message type received: ${message.runtimeType}');
        return;
      }

      var data = json.decode(messageString);

      switch (data['type']) {
        case 'offer':
          _handleOffer(data);
          break;
        case 'answer':
          _handleAnswer(data);
          break;
        case 'candidate':
          _handleCandidate(data);
          break;
        case 'peers':
          setState(() {
            _peers = List<String>.from(data['peers']);
          });
          break;
        default:
          break;
      }
    });
  }

  void _sendSignalingMessage(Map<String, dynamic> message) {
    _channel.sink.add(json.encode(message));
  }

  void _handleOffer(Map<String, dynamic> data) async {
    await _peerConnection.setRemoteDescription(
      RTCSessionDescription(data['sdp'], 'offer'),
    );
    RTCSessionDescription answer = await _peerConnection.createAnswer();
    await _peerConnection.setLocalDescription(answer);

    _sendSignalingMessage({
      'type': 'answer',
      'sdp': answer.sdp,
    });
  }

  void _handleAnswer(Map<String, dynamic> data) async {
    await _peerConnection.setRemoteDescription(
      RTCSessionDescription(data['sdp'], 'answer'),
    );
  }

  void _handleCandidate(Map<String, dynamic> data) async {
    RTCIceCandidate candidate = RTCIceCandidate(
      data['candidate']['candidate'],
      data['candidate']['sdpMid'],
      int.parse(data['candidate']['sdpMLineIndex'].toString()),
    );
    await _peerConnection.addCandidate(candidate);
  }

  Future<void> _createOffer() async {
    if (_selectedPeer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a peer to connect to.')),
      );
      return;
    }

    RTCSessionDescription offer = await _peerConnection.createOffer();
    await _peerConnection.setLocalDescription(offer);

    _sendSignalingMessage({
      'type': 'offer',
      'sdp': offer.sdp,
      'target': _selectedPeer,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Flutter WebRTC Demo'),
      ),
      body: Column(
        children: [
          Expanded(
            child: RTCVideoView(_localRenderer, mirror: true),
          ),
          Expanded(
            child: RTCVideoView(_remoteRenderer),
          ),
          DropdownButton<String>(
            hint: Text('Select Peer'),
            value: _selectedPeer,
            onChanged: (String? newValue) {
              setState(() {
                _selectedPeer = newValue;
              });
            },
            items: _peers.map<DropdownMenuItem<String>>((String peer) {
              return DropdownMenuItem<String>(
                value: peer,
                child: Text(peer),
              );
            }).toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createOffer,
        tooltip: 'Start Call',
        child: Icon(Icons.phone),
      ),
    );
  }
}
