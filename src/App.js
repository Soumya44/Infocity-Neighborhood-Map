import React, { Component } from 'react';
import './App.css';
import { GoogleApiWrapper } from 'google-maps-react' 
import * as constants from './constants'
// import child component
import MapContainer from './MapContainer'
import NavSearch from './NavSearch'

//Handling when  Google's API have any Problem on the request
document.addEventListener("DOMContentLoaded", function(e) {
  let scriptTag = document.getElementsByTagName('SCRIPT').item(1);
  scriptTag.onerror = function(e) {
    console.log('We cant access Google Maps API for now!')
    let mapContainerElemt = document.querySelector('#root');
    let erroElement = document.createElement('div');
    erroElement.innerHTML = '<div class="error-msg">We cant access Google Maps API for now! </div>'
    mapContainerElemt.appendChild(erroElement)
  }
})

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locationsGoogle: []
    }
    this.markersGoogle = [];
    this.onChangeMarker = this.onChangeMarker.bind(this);
    this.handleQuery = this.handleQuery.bind(this);
  }

  onChangeMarker(marker) {
   
    this.markersGoogle.push(marker);

    if(this.markersGoogle.length === constants.locations.length) {
     this.setState({locationsGoogle: this.markersGoogle})
    }
  }

  handleQuery(query) {
    let result = this.state.locationsGoogle.map( location => {
      let matched = location.props.title.toLowerCase().indexOf(query) >= 0;
      if (location.marker) {
        location.marker.setVisible(matched);
      }
      return location;
    })

    this.setState({ locationsGoogle: result });   
  }

  render() {    
    return (
      <div className="App">
        <NavSearch handleQuery={this.handleQuery} />

        <MapContainer 
          google={this.props.google}
          onChangeMarker={this.onChangeMarker}
          locationsGoogle={this.state.locationsGoogle} />
      </div>
    );
  }
}

// OTHER MOST IMPORTANT: Here we are exporting the App component WITH the GoogleApiWrapper. You pass it down with an object containing your API key
export default GoogleApiWrapper({
  apiKey: 'AIzaSyCmui0SAKvXOtN2I2DK8NHm3hQ8rhYfydo',
})(App)
