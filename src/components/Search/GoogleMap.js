import React, { Component } from 'react';
import escapeRegExp from 'escape-string-regexp';
import PropTypes from 'prop-types';

class GoogleMap extends Component {
  /**
   * This function is used to create markers on the map
   * @param:
   *      place (data type: object): location detail of the place
   *      map (data type: object): Google map object
   *      i (data type: integer): index of the place in the location array
   * @returns:
   *      marker(data type: object): new Google Marker object for given place
   */
  static mapMarkerToMap(place, map, i) {
    // Extract first letter from the place name and use it as marker's label
    const label = place.name[0];
    const marker = new window.google.maps.Marker({
      // Use property shorthand of ES6 syntax in place of map: map,
      map,
      position: { lat: place.location.lat, lng: place.location.lng },
      title: place.name,
      animation: window.google.maps.Animation.DROP,
      id: i,
      label,
    });
    return marker;
  }

  /**
   * This function populates the infowindow with wiki link about the place
   * when the marker is clicked. We use use fetch API to get data from
   * Wiki API endpoints. It opens and anchores at the marker that is clicked.
   * @param:
   *      marker(data type: object): marker object for the selected/clicked place
   *      map (data type: object): Google map object
   *      infowindow (data type: object): Google infowindow object from app's state
   * @returns:
   *      None
   */
  static populateInfoWindow = (map, marker, infowindow) => {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.getPosition() !== marker.position) {
      if (infowindow.marker) {
        infowindow.marker.setAnimation(null);
      }

      // Animate the marker clicked or place selcted from the place list
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      infowindow.marker = marker;
      infowindow.setContent(`<div>${marker.title}</div>`);
      infowindow.open(map, marker);
      /**
       * Make sure the marker property is cleared if the infowindow is closed.
       * Also reset the position of the infowindow
       */
      infowindow.addListener('closeclick', () => {
        infowindow.setPosition(null);
        marker.setAnimation(null);
      });

      // Fetch the third party wiki api data for the given place to show inside infowindow
      GoogleMap.fetchWikiData(marker, infowindow);
    }
  };

  /**
   * This function is used to make asynchronous call to Wiki API and
   * We use use fetch API to get data and populate the infowindow with the data
   * also it shows error message in infowindow if API call fails
   * @param:
   *      marker(data type: object): marker object for the selected/clicked place
   *      infowindow (data type: object): Google infowindow object from app's state
   * @returns:
   *      None
   */
  static fetchWikiData = (marker, infowindow) => {
    const address = marker.title;
    // Wiki fetch API url
    const wikiurl = `https://en.wikipedia.org/w/api.php?&origin=*&action=opensearch&format=json&search=${address}`;
    // HTML block for the content to be shown inside infowindow
    let wikiElemItem = `<div role="dialog" class="infowindow" tabindex="0" aria-labelledby="infowindow-help">
      <h2>${address}</h2>
      <p id="infowindow-help">Relevant Wikipedia Links</p>
    <ul>`;

    // fetch API call to retrieve data from Wikipedia
    fetch(wikiurl)
      .then(response => response.json())
      .then((data) => {
        // Check if the response is an error object
        if (data.error && data.error.code && data.error.info) {
          throw data.error.info;
        }
        for (let i = 0; i < data.length; i += 1) {
          // Build the content of infowindow
          wikiElemItem += data[i].length
            ? `<li class="infowindow-item">
                <a target ="_blank" href=http://en.wikipedia.org/wiki/${data[i]}>
                  ${data[i]}
                </a>
            </li>`
            : '';
        }
        wikiElemItem += '</ul></div>';
        // Set the content for infowindow
        infowindow.setContent(wikiElemItem);
      })
      // Catch any error in the Fetch API or javascript error
      .catch((error) => {
        wikiElemItem += `<p class='error' style='color:red'>${error}</p></ul></div>`;
        // Set the error content for infowindow if anything fails
        infowindow.setContent(wikiElemItem);
      });
  };

  // Add PropTypes validation
  static propTypes = {
    locations: PropTypes.instanceOf(Array).isRequired,
    filterText: PropTypes.string.isRequired,
    selectedPlaceTitle: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    // Use createRef() to create a reference to the DOM node we want
    this.myMapContainer = React.createRef();
  }

  // App's internal state
  state = {
    map: null,
    largeInfowindow: null,
    markers: [],
  }

  /**
   * This is a lifecycle hook which runs immediate after the component
   * output has been rendered to the DOM.
   */
  componentDidMount() {
    /**
     * Add the initMap() callback method & googleError onerror method to window
     * to make initMap from react available for Google maps to callback to.
     */
    window.initMap = this.initMap;
    window.googleError = this.googleError;
    // If Google map is already available, invoke the initMap()
    if (typeof window.google === 'object' && typeof window.google.maps === 'object') {
      this.initMap();
    } else {
      // Invoke this method to put the async googleapi script in the DOM
      this.loadGoogleMapAPIJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyCmui0SAKvXOtN2I2DK8NHm3hQ8rhYfydo&callback=initMap');
    }
  }

  /**
   * This method is invoked immediately after updating occurs.
   * It is not called for the initial render.You may call setState()
   * immediately in componentDidUpdate() but note that it must be wrapped in a condition
   */
  componentDidUpdate(prevProps) {
    // destructure the props object into individual variables
    const { filterText, selectedPlaceTitle, locations } = this.props;
    // destructure the app's state object into individual variables
    const { map } = this.state;
    // Invoke the filterMarkerOnMap() if the props is changed
    if (filterText !== prevProps.filterText) {
      this.setState({ markers: this.filterMarkerOnMap(filterText) });
    }
    // Invoke the animateSelectedPlaceOnMap() whenever a new place is selected/clicked
    if (selectedPlaceTitle !== prevProps.selectedPlaceTitle) {
      this.setState({ markers: this.animateSelectedPlaceOnMap(selectedPlaceTitle) });
    }
    // Invoke the loadMarkersOnMap() once the location data is updated in parent component
    if (locations.length && (locations !== prevProps.locations)) {
      /**
       * Do check if the map is initialized or not before loading map markers
       * And also need avoid creating markers during search rather update
       * the existing markers in the app's state using filterMarkerOnMap() above
       */
      if (map && !filterText) {
        this.loadMarkersOnMap();
      }
    }
  }

  /**
   * This function create and add googlemapapis script tag into the DOM
   * @param:
   *      src(data type: string): script href tag value
   * @returns:
   *      None
   */
  loadGoogleMapAPIJS = (src) => {
    const ref = window.document.getElementsByTagName('script')[0];
    const script = window.document.createElement('script');
    script.src = src;
    script.setAttribute('onerror', 'googleError()');
    script.async = true;
    ref.parentNode.insertBefore(script, ref);
  }

  /**
   * This function is Google map callback method once map api is loaded successfully
   * @param:
   *      None
   * @returns:
   *      None
   */
  initMap = () => {
    //console.log("hi callback init");
    const { locations } = this.props;
    // Create google map instance to be added to the DOM
    const map = new window.google.maps.Map(this.myMapContainer.current, {
      center: { lat: 20.342011, lng: 85.804517 },
      zoom: 6,
    });

    // Create google map infowindow instance to be added to the DOM
    const largeInfowindow = new window.google.maps.InfoWindow();
    // Update the app's state object wirh map, largeInfowindow property
    this.setState({ map, largeInfowindow });
    /**
     * This extra check is to make sure we have the location data
     * ready before calling the loadMarkersOnMap() method.
     */
    if (locations.length) {
      this.loadMarkersOnMap();
    }
  }

  /**
   * This function is Google map callback method for unwanted map error
   * @param:
   *      None
   * @returns:
   *      None
   */
  googleError = () => {
    const content = window.document.getElementById('map-error');
    content.hidden = false;
    window.document.getElementById('map').appendChild(content);
  }

  /**
   * This function filter only the selected place from location list
   * and sets the Animation property of the specific marker in the app's
   * markers array state property
   * @param:
   *      placeTitle(data type: string): place name for the selected/clicked place
   * @returns:
   *      markers(data type: array): updated markers array
   */
  animateSelectedPlaceOnMap = (placeTitle) => {
    // destructure the app's state object into individual variables
    const { map, markers, largeInfowindow } = this.state;

    // Loop through markers array to find the impacted marker
    for (let i = 0; i < markers.length; i += 1) {
      if (placeTitle === markers[i].title) {
        // set the animation for the selected marker
        markers[i].setAnimation(window.google.maps.Animation.BOUNCE);
        // Open the infowindow for the selected marker
        GoogleMap.populateInfoWindow(map, markers[i], largeInfowindow);
      } else {
        // set the animation for the mis matched markers to null
        markers[i].setAnimation(null);
      }
    }
    // Return the updated markers array
    return markers;
  };

  /**
   * This function filter markers on the Map for the given input text
   * and sets the map property of the miss matched markers to null
   * so that it won't appear on the map.
   * @param:
   *      filterText(data type: string): marker object for the selected/clicked place
   * @returns:
   *      markers(data type: array): updated markers array
   */
  filterMarkerOnMap = (filterText) => {
    // destructure the app's state object into individual variables
    const { map, markers } = this.state;
    // Generate the RegEx for user input text
    const match = new RegExp(escapeRegExp(filterText.trim()), 'i');
    // Loop through markers array to find the impacted marker
    for (let i = 0; i < markers.length; i += 1) {
      // filter the markers based on input text against marker's title
      if (match.test(markers[i].title)) {
        markers[i].setMap(map);
      } else {
        // set the map for the mis matched markers to null
        markers[i].setMap(null);
      }
    }
    // Return the updated markers array
    return markers;
  }

  /**
   * This function adds markers to the map during initial load as wel as
   * updates the markers on map durion place search.
   * @param:
   *      None
   * @returns:
   *      None
   */
  loadMarkersOnMap = () => {
    //console.log("hi markers");
    // destructure the app's state object into individual variables
    const { map, largeInfowindow, markers } = this.state;
    // destructure the app's props object into individual variables
    const { locations } = this.props;

    // create new map bound instance
    const bounds = new window.google.maps.LatLngBounds();
    // The following group uses the location array to create an array of markers on initialize.
    for (let i = 0; i < locations.length; i += 1) {
      // Create a marker per location, and put into markers array.
      const marker = GoogleMap.mapMarkerToMap(locations[i], map, i);
      // Push the marker to our array of markers.
      markers.push(marker);
      /**
       * Create an onclick event to open an infowindow at each marker.
       * Using closure to make marker available in callbacks
       */
      marker.addListener('click', () => (function captureMarker() {
        GoogleMap.populateInfoWindow(map, marker, largeInfowindow);
      }(marker)));
      // Adjust the map bounds to as per the marker position to fit within the map
      bounds.extend(marker.position);
    }
    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);
  }

  render() {
    return (
      <section id="maptab" role="application">
        {/* HTML block to be used to render the map by Google Map's initMap callback method */}
        <div ref={this.myMapContainer} id="map" aria-label="Places on Map" aria-describedby="map-help" />
        {/* HTML block for the mention that the locations are fetched from Foursquare API. */}
        <div id="map-help">
          <p>
            Map showing the places as per the
            <a target="_blank" rel="noopener noreferrer" href="https://developer.foursquare.com/">
              <span> Foursquare API</span>
            </a>
          </p>
        </div>
        {/* HTML block for googleError callback method by Google Map's onerror attribute */}
        <div id="map-error" aria-label="Can not load the Map" hidden>
          <p>
            <span className="error">
              "This page can not load Google Maps correctly."
            </span>
            <br />
            <em>
              Google Map API now requires the use of a valid API Key.
            </em>
            <br />
            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">
              Go get one!
            </a>
          </p>
        </div>
      </section>
    );
  }
}

export default GoogleMap;
