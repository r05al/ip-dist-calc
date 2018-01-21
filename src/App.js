import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      origin: {
        ip: '', // 74.71.191.58
        lat: '',
        lon: '',
        address: '',
        errors: '',
      },
      destination: {
        ip: '', // 108.21.211.3
        lat: '',
        lon: '',
        address: '',
        errors: '',
      },
      duration: {},
      hasResults: false,
    };

    this.handleIPChange = this.handleIPChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleIPChange(event) {
    const {target: {value, name}} = event;
    this.setState({[name]: {ip: value}});
  }

  buildLocationRequest(ipAddress) {
    return {
      url: 'https://api.graphloc.com/graphql',
      method: 'post', 
      data: {
        query: `{ getLocation(ip: ${ JSON.stringify(ipAddress) }) { location { latitude longitude } } }`
      }
    };
  }

  handleSubmit(event) {
    event.preventDefault();

    const {origin: {ip: originIP}, destination: {ip: destinationIP}} = this.state;
    const originLocReq = axios(this.buildLocationRequest(originIP));
    const destLocReq = axios(this.buildLocationRequest(destinationIP));

    axios.all([originLocReq, destLocReq]).then(axios.spread((originLL, destinationLL) => {
      const {origin, destination} = this.state;
      const {data: {data: {getLocation: originLoc}, errors: originErr}} = originLL;
      const {data: {data: {getLocation: destLoc}, errors: destErr}} = destinationLL;
      if (originErr || destErr) {
        return this.setState({
          origin: {
            ...origin,
            errors: originErr,
          },
          destination: {
            ...destination,
            errors: destErr,
          },
        }, window.alert(`${originErr ? originErr[0].message + ' in the Origin field. ' : ''}${destErr ? destErr[0].message + ' in the Destination field' : ''}`));
      }
      return this.setState({
        origin: {
          ...origin,
          lat: parseFloat(originLoc.location.latitude),
          lon: parseFloat(originLoc.location.longitude),
        },
        destination: {
          ...destination,
          lat: parseFloat(destLoc.location.latitude),
          lon: parseFloat(destLoc.location.longitude),
        },
      }, this.getResults);
    })).catch(err => {
      console.log('graphql error:', err);
    });;
  }

  getResults() {
    const {origin: {lat: oLat, lon: oLon}, destination: {lat: dLat, lon: dLon}} = this.state;

    const dirRequest = {
      origin: {lat: oLat, lng: oLon},
      destination: {lat: dLat, lng: dLon},
      travelMode: 'DRIVING'
    };

    window.directionsService.route(dirRequest, (response, status) => {
      if (status === 'OK') {
        const {duration, end_address, start_address} = response.routes[0].legs[0];
        const newState = {...this.state};
        newState.origin.address = start_address;
        newState.destination.address = end_address;
        newState.duration = duration;
        newState.hasResults = true;
        return this.setState(newState);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

  getComment() {
    const {duration} = this.state;
    const min = duration.value / 60;
    if (min <= 30) {
      return 'Well, that ain\'t far.';
    } else if (min <= 60 * 3) {
      return 'Better pack a lunch.';
    } else if (min <= 60 * 8) {
      return 'Have you tried 5-hour Energy?';
    } else {
      return 'Congrats on getting selected to go to Mars!';
    }
  }

  formatAddress(string) {
    const parsedAddr = string.split(',');
    return (
      <div className="address">
        <span>{parsedAddr[0]}</span>
        <span>{parsedAddr[1]}, {parsedAddr[2]}</span>
      </div>
    );
  }

  render() {
    const {origin: {ip: originIP, address: originAddr, errors: originErr}, destination: {ip: destinationIP, address: destAddr, errors: destErr}, hasResults, duration} = this.state;

    if (hasResults) {
      return (
        <div className="App">
          <header className="App-header">
            <button className="back-btn" type="button" onClick={() => this.setState({hasResults: false})}>Back</button>
            <span className="App-title-results">How long is the drive?</span>
            <div className="underline"/>
            <div className="location">
              <small>Origin:</small>
              {this.formatAddress(originAddr)}
            </div>
            <div className="location">
              <small>Destination:</small>
              {this.formatAddress(destAddr)}
            </div>
            <div className="sub-header">
              <h1 className="sub-h1">{duration.text}</h1>
              <span className="comment">{this.getComment()}</span>
            </div>
          </header>   
        </div>
      );
    }

    return (
      <div className="App">
        <header className="App-header">
          <span className="App-title">How long is the drive?</span>
          <div className="underline"/>
          <form onSubmit={this.handleSubmit}>
            <label>
              <small>Origin:</small>
              <input className={`${originErr ? 'invalid' : ''} input`} name="origin" type="text" value={originIP} onChange={this.handleIPChange} />
            </label>
            <label>
              <small>Destination:</small>
              <input className={`${destErr ? 'invalid' : ''} input`} name="destination" type="text" value={destinationIP} onChange={this.handleIPChange} />
            </label>
            <input className='submit-btn' type="submit" value="Gimme the Distance!" />
          </form>
        </header>
      </div>
    );
  }
}

export default App;
