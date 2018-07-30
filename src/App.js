import React, { Component, Fragment } from 'react';
import './App.css';
import io from "socket.io-client";
import {Transition, animated} from 'react-spring';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
//console.log(ENVIRONMENT);
(ENVIRONMENT === 'development') && console.log("You are running in DEV mode");

const RoomList = (props) => {
  let roomList;
  if(Array.isArray(props.rooms) && props.rooms.length !== 0){
    roomList =
      <ul>
        {props.rooms.map(room => <li key = {room}>{room}</li>)}
      </ul>
  }
  else{
    roomList = 
      <h1>No rooms yet</h1>
  }
  return roomList;
}
const SingleInput = (props) => {
  let inputClass = 'single-input-text-box';
  let submitClass = 'single-input-submit-button';
  if(props.classes){
    inputClass += ' ' + props.classes;
    submitClass += ' ' + props.classes;
  }
  return(
    <React.Fragment>
      <input
        name={props.name}
        type="text"
        value={props.content}
        onChange={props.controlFunc}
        placeholder={props.placeholder}
        className={inputClass}
        autoComplete='off'
      />
      <input type="submit" value="Submit" className = {submitClass}/>
    </React.Fragment>
  )
}
const NameAndRoomInput = (props) => (
  <div>
    <form onSubmit={props.handlePlayerNameSubmit}>
      <h5>Player Name Input</h5>
      <SingleInput 
        title = {'Player Name'}
        name = {'playerName'}
        controlFunc = {props.handlePlayerNameChange}
        content={props.playerName}
        placeholder={'Enter your player name'}
      />
    </form>
    <form onSubmit={props.handleRoomNameSubmit}>
      <h5>Room Name Input</h5>
      <SingleInput 
        title = {'Room Name'}
        name = {'roomName'}
        controlFunc = {props.handleRoomNameChange}
        content= {props.roomName}
        placeholder={'Enter your room name'}
      />
    </form>
  </div>
)
const TeamToggle = (props) => (
  <div>
    <button onClick={() => props.onClick('X')}>X</button>
    <button onClick={() => props.onClick('O')}>O</button>
    <button onClick={() => props.onClick('')}>Spectate</button>
  </div>
)
const TeamList = (props) => (
    props.team.map(player => <li key={player.id}>{player.name}</li>)
);
const PlayersDisplay = (props) => {
  let player = props.player;
  let XTeam = []; 
  let OTeam = [];
  let noTeam = [];
  if(props.players.length > 0){
    XTeam = props.players.filter(player => player.team === 'X');
    OTeam = props.players.filter(player => player.team === 'O');
    noTeam = props.players.filter(player => player.team === '');
  }
  else{
    switch(player.team){
      case 'X':
        XTeam.push(player)
        break;
      case 'O':
        OTeam.push(player)
        break;
      case '':
        noTeam.push(player)
        break;
      default:
        console.log('Invalid team');
        break;
    }
  }
  return(
    <div>
      X players
      <ul>
        <TeamList team={XTeam} />
      </ul>
      O players
      <ul>
        <TeamList team={OTeam} />
      </ul>
      Spectators
      <ul>
        <TeamList team={noTeam} />
      </ul>
    </div>
  );
}

class GameInfo extends Component{
  render(){
    return (
      <div>
        <TeamToggle onClick={this.props.onTeamToggleClick}/>
        <button onClick={()=>this.props.onResetClick()}>Reset Room</button>
        <button onClick={()=>this.props.onLeaveRoomClick()}>Leave Room</button>
        <div>You are in room: {this.props.player.roomName}</div>
        <div>It is {this.props.room.currentPlayer}'s turn</div>
        <div>The winner is: {this.props.room.winner}</div>
        <PlayersDisplay player={this.props.player} players={this.props.room.players} />
      </div>
    );
  }
}

const Square = (props) => (
    <button className = "square" onClick={props.onClick}>
      {props.value}
    </button>
)

class Board extends Component{
  renderSquare = (i) => {
    return (
      <Square 
        value = {this.props.squares[i]}
        key = {i}
        onClick = {() => this.props.onClick(i)}
      />
    );
  }
  createTable = () => {
    let rows = [];
    for(let i=0; i<3; i++){
      let columns = [];
      for(let j=0; j<3; j++){
        columns.push(this.renderSquare(j+(i*3)));
      }
      rows.push(
        <div className="board-row" key={i}>
          {columns}
        </div>
      );
    }
    return rows;
  }
  render(){
    return (
      <div>
        {this.createTable()}
      </div>
    );
  }
}

const NameInput = (props) => {
  const {playerNameConfirmed, isChangingName} = props;
  const inputClass = playerNameConfirmed ? 'name' : 'no-name';
  const containerClass = 'input-container ' + (playerNameConfirmed ? 'name' : 'no-name');
  const formClass = 'input-form ' + (playerNameConfirmed ? 'name' : 'no-name');
  return(
    <div className = {containerClass}>
      {isChangingName ?
        <form onSubmit={props.handlePlayerNameSubmit} className={formClass}>
          <SingleInput 
            classes = {inputClass}
            title = 'Player Name'
            name='name'
            controlFunc = {props.handlePlayerNameChange}
            content={props.playerName}
            placeholder={'Enter a name!'}
          />
        </form>
      :
        <span className='input-container name-confirmed'>
          <div>
            Your name is {playerNameConfirmed}!
          </div>
          <div>
            <button onClick={props.handleIsChangeNameToggle}>Change name</button>
          </div>
        </span>
      }
    </div>
  )
}
const RoomInput = (props) => {
  const {roomNameConfirmed} = props;
  const inputClass = roomNameConfirmed ? 'room' : 'no-room';
  const containerClass = 'input-container ' + (roomNameConfirmed ? 'room' : 'no-room');
  const formClass = 'input-form ' + (roomNameConfirmed ? 'room' : 'no-room');
  return(
    <div className={containerClass}>
      <form onSubmit={props.handleRoomNameSubmit} className={formClass}>
        <SingleInput
          classes = {inputClass}
          title = 'Room Name'
          name = 'roomName'
          controlFunc = {props.handleRoomNameChange}
          content = {props.roomName}
          placeholder = {'Enter a room!'}
        />
      </form>
    </div>
  )
}

class GameContainer extends Component{
  constructor(props){
    super(props);
    this.state = {
      isConnected: false,
      isChangingName: true,
      response: false,
      playerName: '',
      roomName: '',
      playerData: {name: '', roomName: null, team: '', id: ''},
      roomData: {squares: Array(9).fill(null), players: [], currentPlayer: null, winner: null},
      socket: null,
    };
    this.handlePlayerNameChange = this.handlePlayerNameChange.bind(this);
    this.handlePlayerNameSubmit = this.handlePlayerNameSubmit.bind(this);
    this.handleIsChangeNameToggle = this.handleIsChangeNameToggle.bind(this);
    this.handleRoomNameChange = this.handleRoomNameChange.bind(this);
    this.handleRoomNameSubmit = this.handleRoomNameSubmit.bind(this);
    this.handleSquareClick = this.handleSquareClick.bind(this);
    this.handleTeamToggleClick = this.handleTeamToggleClick.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);
    this.handleLeaveRoomClick = this.handleLeaveRoomClick.bind(this);
  }
  componentDidMount(){
    this.initSocket();
  }
  initSocket = () => {
    let socket;
    if(ENVIRONMENT === 'development'){
      let LOCALIP = process.env.REACT_APP_LOCAL_IP || 'localhost';
      console.log(LOCALIP);
      socket = io(`http://${LOCALIP}:8000`);
    } else {
      socket = io();
    }
    socket.on("hello", (rooms) => {
      console.log('we made contact!');
      this.setState({ rooms, isConnected: true });
    });
    socket.on('game-data', (roomData) => {
      console.log(roomData);
      this.setState({ roomData });
    });
    socket.on('player-data', (playerData) => {
      console.log(playerData);
      this.setState({ playerData });
    });
    socket.on('rooms', (rooms) =>{
      this.setState({ rooms });
    });
    socket.on('disconnect', () => {
      console.log('disconnected!!!');
      this.setState({ isConnected: false });
    });
    this.setState({socket});
  }
  handlePlayerNameChange(e) {
    this.setState({ playerName: e.target.value });
  }
  handleIsChangeNameToggle() {
    this.setState({isChangingName: true})
  }
  handleRoomNameChange(e) {
    this.setState({ roomName: e.target.value });
  }
  handlePlayerNameSubmit(e) {
    e.preventDefault();
    this.state.socket.emit('set-name', this.state.playerName, () => {
      this.setState({isChangingName: false})
    });
  }
  handleRoomNameSubmit(e) {
    e.preventDefault();
    this.state.socket.emit('join-room', this.state.roomName);
  }
  handleSquareClick(i) {
    this.state.socket.emit('new-square', i);
  }
  handleTeamToggleClick(team) {
    this.state.socket.emit('set-team', team);
  }
  handleResetClick() {
    this.state.socket.emit('reset-game');
  }
  handleLeaveRoomClick() {
    this.state.socket.emit('leave-room');
  }
  renderIsConnected() {
      const isConnected = this.state.isConnected;
      let isConnectedText;
      if(isConnected){
        isConnectedText =
          <div>You are connected</div>;
      } else{
        isConnectedText =
          <div>DISCONNECTED</div>;
      }
      return isConnectedText;
  }
  render(){
    const squares = this.state.roomData.squares;
    const isConnected = this.renderIsConnected();
    const playerNameConfirmed = this.state.playerData.name;
    const roomNameConfirmed = this.state.playerData.roomName;
    const {isChangingName} = this.state;
    return (
      <Fragment>
        <div className='game-container'>
          <NameInput
            playerNameConfirmed = {playerNameConfirmed}
            isChangingName = {isChangingName} 
            handlePlayerNameChange = {this.handlePlayerNameChange}
            handlePlayerNameSubmit = {this.handlePlayerNameSubmit}
            handleIsChangeNameToggle = {this.handleIsChangeNameToggle}
            playerName={this.state.playerName}
          />
          {
            playerNameConfirmed &&
            <RoomInput
            roomNameConfirmed = {roomNameConfirmed}
            handleRoomNameChange = {this.handleRoomNameChange}
            handleRoomNameSubmit = {this.handleRoomNameSubmit}
            roomName = {this.state.roomName}
          />}
        </div>

        
        <div>
          {isConnected}
          <RoomList rooms={this.state.rooms} />
          <NameAndRoomInput
            handlePlayerNameChange = {this.handlePlayerNameChange}
            handlePlayerNameSubmit = {this.handlePlayerNameSubmit}
            playerName = {this.state.playerName}
            handleRoomNameChange = {this.handleRoomNameChange}
            handleRoomNameSubmit = {this.handleRoomNameSubmit}
            roomName = {this.state.roomName}
          />
          <div>
            <Board squares = {squares} onClick = {this.handleSquareClick}/>
            <GameInfo
              player={this.state.playerData}
              room={this.state.roomData}
              onTeamToggleClick={this.handleTeamToggleClick}
              onResetClick={this.handleResetClick}
              onLeaveRoomClick={this.handleLeaveRoomClick}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

class App extends Component {
  render() {
    return (
        <GameContainer />
    );
  }
}

export default App;
