import React from 'react';

import Peer from 'peerjs';

import Config from '../config';
import LobbyList from './lobby-list';
import Square from './square';
import GameStates from '../constants/game-states';

import {
  calculateWinner,
  determineStatus,
} from '../helpers';

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
    const {connState} = this.state.connState;
    const status = determineStatus(
      calculateWinner(this.state.squares),
      this.state.xIsNext ? 'X': 'O',
    );

    return (
      <div>
        <div className="connstatus">{connState}</div>
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
        <div className="peer-id">My peer id is: <span className="id-code">{this.state.peer_id}</span></div>
        <input type="text" placeholder="remote peer id" id="remotepeer" />
        <input className="connect-button" type="submit" value="connect" onClick={() => this.connect()} />
        <div className="lobby">
				<h3>Click a user to challenge</h3>
        <div className="list"><LobbyList friends={this.state.inlobby} /></div>
        </div>
      </div>
    );
  }
}