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
        if (squares[i]) {
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
    return ( <
        button className = "square"
        onClick = {
            props.onClick
        } > {
            props.value
        } <
        /button>
    );
}

function LobbyList(props) {
    const friends = props.friends;
    const listItems = friends.map((number) =>
        <
        li onClick = {
            () => {
                document.getElementById('remotepeer').value = number;
            }
        }
        key = {
            number
        } > {
            number
        } < /li>
    );
    return ( <
        ul > {
            listItems
        } < /ul>
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
        this.handleLobbyConnection = this.handleLobbyConnection.bind(this);
        this.handlePlayerConnection = this.handlePlayerConnection.bind(this);
        this.handlePlayerData = this.handlePlayerData.bind(this);
        this.handleFakeClick = this.handleFakeClick.bind(this);

        this.state.peer.on('open', (id) => {
            this.setState({
                peer_id: id
            });
            var lconn = this.state.peer.connect(LOBBY_NAME);
            lconn.on('open', this.handleLobbyConnection);
            lconn.on('data', (data) => {
                console.log("setting lobby", data);
                this.setState({
                    inlobby: data
                });
            });
        });

        this.state.peer.on('connection', (conn) => {
            console.log("got connection from", conn.peer);
            if (this.state.conn == null) {
                this.setState({
                    conn: conn,
                    connState: states.PLAYER_O
                });
                conn.on('data', this.handlePlayerData);
            } else {
                console.log("already connected");
                conn.close();
            }
        });
    }

    handleLobbyConnection() {
        console.log("connected to lobby");
        var lobby_query = () => {
            this.state.peer.connect(LOBBY_NAME).send("QUERY");
            if (this.state.connState === states.NOT_CONNECTED) {
                this.state.peer.connect(LOBBY_NAME).send("READY");
            }
            window.setTimeout(lobby_query,
                5000
            );
        }
    }
    handlePlayerConnection() {
        const remotePeerId = document.getElementById('remotepeer').value;
        if (remotePeerId !== "") {
            var conn = this.state.peer.connect(remotePeerId);
            conn.on('open', () => {
                console.log("connected to player", remotePeerId);
                this.setState({
                    conn: conn,
                    connState: states.PLAYER_X
                });
                conn.on('data', this.handlePlayerData);
            });
        }
    }

    handlePlayerData(data) {
        console.log("received data", data);
        if (data.type === "move") {
            const squares = this.state.squares.slice();
            squares[data.move] = this.state.xIsNext ? 'X' : 'O';
            const winner = calculateWinner(squares);
            this.setState({
                squares: squares,
                xIsNext: !this.state.xIsNext,
                winner: winner
            });
            if (winner) {
                this.state.conn.send({
                    type: "gameover",
                    winner: winner
                });
            }
        } else if (data.type === "gameover") {
            this.setState({
                winner: data.winner
            });
        }
    }

    handleFakeClick(i) {
        if (this.state.conn && this.state.xIsNext && !this.state.winner) {
            const squares = this.state.squares.slice();
            if (squares[i] || this.state.xIsNext !== true) {
                return;
            }
            squares[i] = 'X';
            const winner = calculateWinner(squares);
            this.setState({
                squares: squares,
                xIsNext: false,
                winner: winner
            });
            this.state.conn.send({
                type: "move",
                move: i
            });
            if (winner) {
                this.state.conn.send({
                    type: "gameover",
                    winner: winner
                });
            }
        }
    }

    renderSquare(i) {
        return ( <
            Square value = {
                this.state.squares[i]
            }
            onClick = {
                () => this.handleFakeClick(i)
            }
            />
        );
    }

    render() {
        let status;
        if (this.state.winner) {
            status = 'Winner: ' + this.state.winner;
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }
        return ( <
            div >
            <
            div className = "game-status" > {
                status
            } < /div> <
            div className = "game-board" >
            <
            div className = "board-row" > {
                this.renderSquare(0)
            } {
                this.renderSquare(1)
            } {
                this.renderSquare(2)
            } <
            /div> <
            div className = "board-row" > {
                this.renderSquare(3)
            } {
                this.renderSquare(4)
            } {
                this.renderSquare(5)
            } <
            /div> <
            div className = "board-row" > {
                this.renderSquare(6)
            } {
                this.renderSquare(7)
            } {
                this.renderSquare(8)
            } <
            /div> < /
            div > <
            div >
            <
            input type = "text"
            id = "remotepeer"
            placeholder = "remote peer id" / >
            <
            button onClick = {
                this.handlePlayerConnection
            } > Connect < /button> < /
            div > <
            LobbyList friends = {
                this.state.inlobby
            }
            /> < /
            div >
        );
    }
}

// ========================================

ReactDOM.render( <
    Board / > ,
    document.getElementById('root')
);
