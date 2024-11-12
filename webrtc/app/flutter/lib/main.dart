import 'dart:typed_data';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:async';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Flutter WebRTC Demo',
      home: WebRTCSample(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class WebRTCSample extends StatefulWidget {
  const WebRTCSample({super.key});

  @override
  State<WebRTCSample> createState() => _WebRTCSampleState();
}

class _WebRTCSampleState extends State<WebRTCSample> {
  late RTCPeerConnection _peerConnection;
  late MediaStream _localStream;
  late WebSocketChannel _channel;
  final _remoteRenderer = RTCVideoRenderer();
  final _localRenderer = RTCVideoRenderer();
  final _peersController = StreamController<List<String>>.broadcast();
  List<String> _peers = [];
  String? _selectedPeer;
  // tips: サーバーから取得したuidを設定する
  // ignore: prefer_final_fields
  String _userId = 'user_a'; // Unique user ID
  bool _isMuted = false;
  bool _isCameraOff = false;

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
    _peersController.close();
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
        // todo: Kubernetes のデプロイ先に合わせて変更する
        {'urls': 'stun:192.168.40.249:3478'},
      ],
    };

    final pc = await createPeerConnection(configuration);

    pc.onIceCandidate = (RTCIceCandidate candidate) {
      debugPrint('Sending ICE candidate to peer: ${candidate.toMap()}');
      _sendSignalingMessage({
        'type': 'candidate',
        'candidate': candidate.toMap(),
        'targetId': _selectedPeer,
        'userId': _userId, // 自身の userId を追加
      });
    };

    pc.onTrack = (RTCTrackEvent event) {
      if (event.track.kind == 'video') {
        debugPrint('Received remote video track');
        setState(() {
          _remoteRenderer.srcObject = event.streams.first;
        });
      }
    };

    return pc;
  }

  void _connectToSignalingServer() {
    // todo: Kubernetes のデプロイ先に合わせて変更する
    // シグナリングサーバーは WebSocket なので、単独で Cloud Run でも問題なさそう？
    _channel = WebSocketChannel.connect(Uri.parse('ws://192.168.40.249:3000'));

    _channel.stream.listen((message) {
      String messageString;

      if (message is String) {
        messageString = message;
      } else if (message is Uint8List) {
        messageString = utf8.decode(message);
      } else {
        debugPrint('Unsupported message type received: ${message.runtimeType}');
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
          _peers = List<String>.from(data['peers']);
          _peersController.add(_peers);
          break;
        default:
          break;
      }
    });

    _sendSignalingMessage({
      'type': 'register',
      'userId': _userId,
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
      'targetId': data['userId'], // オファー送信者の userId を使用
      'userId': _userId, // 自身の userId を追加
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
        const SnackBar(content: Text('Please select a peer to connect to.')),
      );
      return;
    }

    RTCSessionDescription offer = await _peerConnection.createOffer();
    await _peerConnection.setLocalDescription(offer);

    _sendSignalingMessage({
      'type': 'offer',
      'sdp': offer.sdp,
      'targetId': _selectedPeer,
      'userId': _userId, // 自身の userId を追加
    });
  }

  // todo: ミュート実装は未検証
  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _localStream.getAudioTracks().forEach((track) {
        track.enabled = !_isMuted;
      });
    });
  }

  void _toggleCamera() {
    setState(() {
      _isCameraOff = !_isCameraOff;
      _localStream.getVideoTracks().forEach((track) {
        track.enabled = !_isCameraOff;
      });
    });
  }

  void _endCall() {
    _peerConnection.close();
    _localStream.getTracks().forEach((track) {
      track.stop();
    });
    _localRenderer.srcObject = null;
    _remoteRenderer.srcObject = null;

    // tips: 本実装ではPeerの切断後、Navigator.popで前の画面に戻るが良さそう

    _createPeerConnection().then((pc) {
      _peerConnection = pc;
      _startLocalStream();
    });

    setState(() {
      _selectedPeer = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Flutter WebRTC Demo - $_userId'),
      ),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      Expanded(
                        child: RTCVideoView(_localRenderer, mirror: true),
                      ),
                      Expanded(
                        child: RTCVideoView(_remoteRenderer),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Column(
                    children: [
                      Expanded(
                        child: StreamBuilder<List<String>>(
                          stream: _peersController.stream,
                          builder: (context, snapshot) {
                            if (snapshot.connectionState ==
                                ConnectionState.waiting) {
                              return const CircularProgressIndicator();
                            }
                            if (snapshot.hasError) {
                              return Text('Error: ${snapshot.error}');
                            }
                            snapshot.data!
                                .removeWhere((element) => element == _userId);
                            if (!snapshot.hasData || snapshot.data!.isEmpty) {
                              return const Text('No peers available');
                            }
                            return ListView.builder(
                              itemCount: snapshot.data!.length,
                              itemBuilder: (context, index) {
                                final peer = snapshot.data![index];
                                final isSelected = peer == _selectedPeer;
                                return ListTile(
                                  title: Text(
                                    peer,
                                    style: TextStyle(
                                      color: isSelected
                                          ? Colors.green
                                          : Colors.black,
                                    ),
                                  ),
                                  tileColor:
                                      isSelected ? Colors.green[100] : null,
                                  onTap: isSelected
                                      ? null
                                      : () {
                                          setState(() {
                                            _selectedPeer = peer;
                                          });
                                          _createOffer();
                                        },
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              IconButton(
                icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
                onPressed: _toggleMute,
              ),
              IconButton(
                icon: Icon(_isCameraOff ? Icons.videocam_off : Icons.videocam),
                onPressed: _toggleCamera,
              ),
              IconButton(
                icon: const Icon(Icons.call_end),
                onPressed: _endCall,
              ),
            ],
          ),
        ],
      ),
    );
  }
}