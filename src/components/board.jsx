import React from 'react';

import Peer from 'peerjs';

import Config from '../config';
import LobbyList from './lobby-list';
import Square from './square';
import GameStates from '../constants/game-states';

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

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
      peer: new Peer(),
      peer_id: null,
      conn: null,
      connState: GameStates.NOT_CONNECTED,
      inlobby: [],
    };
    this.state.peer.on('open', (id) => {
      this.setState({peer_id: id});
      var lconn = this.state.peer.connect(Config.LOBBY_NAME);
      lconn.on('open', () => {
        console.log("connected to lobby");
        var lobby_query = () => {
          lconn.send("QUERY");
          if (this.state.connState === GameStates.NOT_CONNECTED) {
            lconn.send("READY");
          }
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
        this.setState({conn: conn, connState: GameStates.PLAYER_O});
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
    if (this.state.connState === GameStates.PLAYER_X && this.state.xIsNext) {
      this.handleFakeClick(i);
    } else if (this.state.connState === GameStates.PLAYER_O && !this.state.xIsNext) {
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
      this.setState({conn: conn, connState: GameStates.PLAYER_X});
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
        <div class="peer-id">My peer id is: <span class="id-code">{this.state.peer_id}</span></div>
        <input type="text" placeholder="remote peer id" id="remotepeer" />
        <input class="connect-button" type="submit" value="connect" onClick={() => this.connect()} />
        <div class="lobby">
				<h3>Click a user to challenge</h3>
        <div class="list"><LobbyList friends={this.state.inlobby} /></div>
        </div>
      </div>
    );
  }
}