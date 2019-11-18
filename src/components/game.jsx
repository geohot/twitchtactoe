import React from 'react';

import Peer from 'peerjs';

import Config from '../config';
import Board from './board';

export default class Game extends React.Component {
  componentDidMount() {
    console.log("trying to create lobby");

    let peers = {};

    // this may fail unless you are the first player
    const lobby = new Peer(Config.LOBBY_NAME);
    lobby.on('open', function(id) {
      console.log('Lobby peer ID is: ' + id);
    });

    lobby.on('connection', (conn) => {
      console.log('lobby connection', conn.peer);
      conn.on('data', (data) => {
        if (data === "READY") { 
          peers[conn.peer] = (new Date()).getTime();
        }
        if (data === "QUERY") { 
          conn.send(Object.keys(peers));
        }
      });
    });

    function expire() {
      for (const k in peers) {
        const now = (new Date()).getTime();
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