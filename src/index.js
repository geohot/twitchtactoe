import React from 'react';
import ReactDOM from 'react-dom';
import Peer from 'peerjs';
import './index.css';

const LOBBY_NAME = "twitchtactoe-lobby";

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  let filledSquares = 0;
  for (let i = 0; i < squares.length; i++) {
    if(squares[i]) {
      filledSquares++;
    }
  }
  if (filledSquares === squares.length) {
    return 'draw';
  } else {
    return null;
  }
}

function Square(props) {
  return (
    <button className="square" onClick={props.onClick} >
      {props.value}
    </button>
  );
}

function LobbyList(props) {
  const friends = props.friends;
	const listItems = friends.map((number) =>
    <li onClick={() => {document.getElementById('remotepeer').value=number;}} key={number}>{number}</li>
  );
  return (
    <ul>{listItems}</ul>
  );
}

const states = {
  NOT_CONNECTED: "not_connected",
  PLAYER_X: "player_x",
  PLAYER_O: "player_o"
};

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
      peer: new Peer(),
      peer_id: null,
      conn: null,
      connState: states.NOT_CONNECTED,
      inlobby: [],
    };
    this.state.peer.on('open', (id) => {
      this.setState({peer_id: id});
      var lconn = this.state.peer.connect(LOBBY_NAME);
      lconn.on('open', () => {
        console.log("connected to lobby");
        function lobby_query() {
          lconn.send("QUERY");
          window.setTimeout(lobby_query, 1000);
        }
        lobby_query();
      });
      lconn.on('data', (data) => {
        console.log("setting lobby", data);
        this.setState({inlobby: data});
      });
    });
    this.state.peer.on('connection', (conn) => {
      console.log("got connection from", conn.peer);
      if (this.state.conn == null) {
        this.setState({conn: conn, connState: states.PLAYER_O});
        conn.on('data', (data) => {
          console.log('Received', data);
          if (this.state.xIsNext) {
            // handle X press
            this.handleFakeClick(Number(data));
          }
        });
      } else {
        console.log("already connected");
        conn.close();
      }
    });
  }

  handleClick(i) {
    if (this.state.connState === states.PLAYER_X && this.state.xIsNext) {
      this.handleFakeClick(i);
    } else if (this.state.connState === states.PLAYER_O && !this.state.xIsNext) {
      this.handleFakeClick(i);
    }
  }

  handleFakeClick(i) {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    this.state.conn.send(i);
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext,
    });
  }

  renderSquare(i) {
    return <Square
      value={this.state.squares[i]}
      onClick={() => this.handleClick(i)}
    />;
  }

  connect() {
    var rp = document.getElementById("remotepeer").value;
    console.log("connect to", rp);
    var conn = this.state.peer.connect(rp);
    conn.on('open', () => {
      console.log("connection open");
      this.setState({conn: conn, connState: states.PLAYER_X});
    });
    conn.on('data', (data) => {
      console.log('Received back', data);
      if (!this.state.xIsNext) {
        // handle O press
        this.handleFakeClick(Number(data));
      }
    });
  }

  render() {
    const winner = calculateWinner(this.state.squares);
    let connstatus = this.state.connState;
    let status;
    if (winner != null) {
      if (winner === 'draw') {
        status = 'Game is a draw';
      } else {
        status = 'Winner: ' + winner;
      }
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div>
        <div className="connstatus">{connstatus}</div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
        <div>My peer id is: {this.state.peer_id}</div>
        <input type="text" placeholder="remote peer id" id="remotepeer" />
        <input type="submit" value="connect" onClick={() => this.connect()} />
				<h3>Click a user to challenge</h3>
        <div><LobbyList friends={this.state.inlobby} /></div>
      </div>
    );
  }
}

class Game extends React.Component {
  componentDidMount() {
    console.log("trying to create lobby");

    let peers = {};

    // this may fail unless you are the first player
    var lobby = new Peer(LOBBY_NAME);
    lobby.on('open', function(id) {
      console.log('Lobby peer ID is: ' + id);
    });

    lobby.on('connection', (conn) => {
      console.log('lobby connection', conn.peer);
      conn.on('data', (data) => {
        peers[conn.peer] = (new Date()).getTime();
        conn.send(Object.keys(peers));
      });
    });

    function expire() {
      for (var k in peers) {
        var now = (new Date()).getTime();
        if (now - peers[k] > 3000) {
          delete peers[k];
        }
      }
      window.setTimeout(expire, 1000);
    }
    expire();
  }
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

