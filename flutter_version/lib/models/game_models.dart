enum Role { raja, rani, mantri, sipahi, police, chor }

enum GameState { waiting, lobby, playing, completed, interrupted }

class RoleInfo {
  final String name;
  final String icon;
  final Color color;
  final String description;
  final int points;
  final int chainOrder;

  const RoleInfo({
    required this.name,
    required this.icon,
    required this.color,
    required this.description,
    required this.points,
    required this.chainOrder,
  });
}

class Player {
  final String id;
  final String name;
  final Role? role;
  final bool isHost;
  final bool isLocked;
  final bool isCurrentTurn;
  final String userId;

  const Player({
    required this.id,
    required this.name,
    this.role,
    required this.isHost,
    required this.isLocked,
    required this.isCurrentTurn,
    required this.userId,
  });

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] != null ? Role.values.byName(json['role']) : null,
      isHost: json['isHost'] ?? false,
      isLocked: json['isLocked'] ?? false,
      isCurrentTurn: json['isCurrentTurn'] ?? false,
      userId: json['userId'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role?.name,
      'isHost': isHost,
      'isLocked': isLocked,
      'isCurrentTurn': isCurrentTurn,
      'userId': userId,
    };
  }

  Player copyWith({
    String? id,
    String? name,
    Role? role,
    bool? isHost,
    bool? isLocked,
    bool? isCurrentTurn,
    String? userId,
  }) {
    return Player(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      isHost: isHost ?? this.isHost,
      isLocked: isLocked ?? this.isLocked,
      isCurrentTurn: isCurrentTurn ?? this.isCurrentTurn,
      userId: userId ?? this.userId,
    );
  }
}

class Game {
  final String id;
  final List<Player> players;
  final GameState state;
  final String? currentTurnPlayerId;
  final DateTime createdAt;
  final String? hostId;
  final String? interruptionReason;

  const Game({
    required this.id,
    required this.players,
    required this.state,
    this.currentTurnPlayerId,
    required this.createdAt,
    this.hostId,
    this.interruptionReason,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    final playersData = json['players'];
    List<Player> playersList = [];
    
    if (playersData is List) {
      playersList = playersData.map((p) => Player.fromJson(Map<String, dynamic>.from(p))).toList();
    } else if (playersData is Map) {
      playersList = playersData.values.map((p) => Player.fromJson(Map<String, dynamic>.from(p))).toList();
    }

    return Game(
      id: json['id'] ?? '',
      players: playersList,
      state: GameState.values.firstWhere(
        (e) => e.name == json['state'],
        orElse: () => GameState.waiting,
      ),
      currentTurnPlayerId: json['currentTurnPlayerId'],
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt'] ?? 0),
      hostId: json['hostId'],
      interruptionReason: json['interruptionReason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'players': players.map((p) => p.toJson()).toList(),
      'state': state.name,
      'currentTurnPlayerId': currentTurnPlayerId,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'hostId': hostId,
      'interruptionReason': interruptionReason,
    };
  }

  Game copyWith({
    String? id,
    List<Player>? players,
    GameState? state,
    String? currentTurnPlayerId,
    DateTime? createdAt,
    String? hostId,
    String? interruptionReason,
  }) {
    return Game(
      id: id ?? this.id,
      players: players ?? this.players,
      state: state ?? this.state,
      currentTurnPlayerId: currentTurnPlayerId ?? this.currentTurnPlayerId,
      createdAt: createdAt ?? this.createdAt,
      hostId: hostId ?? this.hostId,
      interruptionReason: interruptionReason ?? this.interruptionReason,
    );
  }
}