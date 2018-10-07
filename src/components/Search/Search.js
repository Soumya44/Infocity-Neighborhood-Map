import React, { Component } from 'react';
import escapeRegExp from 'escape-string-regexp';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import Filter from './Filter';
import PlacesList from './PlacesList';
import GoogleMap from './GoogleMap';

class Search extends Component {
  /**
   * When user type in to filter place, the typed input will only be
   * processed 300ms after the user's last keystroke. This will reduce the number
   * of call to updateQueryState() to update the component state hence the rendering.
   * @param:
   *      query (data type: string): user input text
   * @returns:
   *      None
   */
  updateQuery = debounce((query) => { this.updateQueryState(query); }, 300);

  // Add PropTypes validation
  static propTypes = {
    isListOpen: PropTypes.bool.isRequired,
  };

  // App's internal state
  state = {
    locations: [],
    filterQuery: '',
    selectedPlaceTitle: '',
  }

  /**
   * This is a lifecycle hook which runs immediate after the component
   * output has been rendered to the DOM.
   */
  componentDidMount() {
    // We are making a call to foursquare API once the components are mounted
    fetch('https://api.foursquare.com/v2/venues/search?ll=20.339457,85.807439&client_id=0UOOVVQUXZTSOJ5302UDTB1L500GIY0RCTXSTUJYXUIFGJXG&client_secret=IBQQ0QYDBQCBCDZ3QBRSVC1JWKU0HGMIIMDVM4DOJW34RGAB&limit=25&v=20180707')
      .then((response) => {
        if (response.status === 200) {
          // return the venue details from the API if request is successful
          return response.json();
        }
        // Throw data not found error if API endpoint respond with status other that 200
        throw Error('No data found for co-ordinates: 22.5726,88.3639');
      })
      .then((data) => {
        if (data.response && data.response.venues) {
          //console.log('Fetch Request Successful');
          const locations = data.response.venues;
          // Add location details to app internal state
          this.setState({ locations });
        } else {
        // Throw error if the response does not contain venues property
          throw Error('No venues detail found for co-ordinates: 22.5726,88.3639');
        }
      })
      // Catch any error in the Fetch API or javascript error
      .catch(error => this.handleRequestError(error));
  }

  /**
   * catch handler for foursquare API request error
   * it add HTML element with error message to UI
   * @param:
   *      error (data type: object): Error object with error details
   * @returns:
   *      None
   */
  handleRequestError = (error) => {
    const listElement = window.document.getElementById('places-list');
    const errorPara = window.document.createElement('p');
    errorPara.className = 'error';
    errorPara.textContent = error;
    errorPara.style = 'color: red';
    listElement.appendChild(errorPara);
  }

  /**
   * This handler function sets the filterQuery with the user entered text on real-time
   * It is then passed as props to GoogleMap component to filter the map markers on Map
   * @param:
   *      filterQuery(data type: string): search text from input field
   * @returns:
   *      None
   */
  updateQueryState = (filterQuery) => {
    this.setState({ filterQuery });
  }


  /**
   * This handler function sets the state property selectedPlaceTitle if a user clicks or select
   * any place from the place listing. It is then passed as props to GoogleMap component
   * to animate the selected markers on Map.
   * @param:
   *      selectedPlaceTitle(data type: string): title of the selected place from the list
   * @returns:
   *      None
   */
  selectPlace = (selectedPlaceTitle) => {
    this.setState({ selectedPlaceTitle });
  }

  render() {
    // destructure the app's state object into individual variables
    const { locations, filterQuery, selectedPlaceTitle } = this.state;
    const { isListOpen } = this.props;
    let filteredLocations;
    if (filterQuery.trim()) {
      // Generate the RegEx for user input text
      const match = new RegExp(escapeRegExp(filterQuery.trim()), 'i');

      /**
        * Filter the location data based on input text against location name
        * and store the filtered results in new array which will be passed
        * as props to the GoogleMap and PlaceList component to filer
        * the shown listing and markers on the map
      */
      filteredLocations = locations.filter(location => match.test(location.name));
    } else {
      // Use the default set of location if the user enters black text
      filteredLocations = locations;
    }

    return (
      <main aria-label="Neighborhood Map" role="main">
        <section id="placelistview" className={isListOpen ? 'listview open' : 'listview'}>
          {/* Search Input component */}
          <Filter updateQuery={this.updateQuery} />
          {/* PlaceList component - By default adds all the places as list items on UI */}
          <PlacesList
            locations={filteredLocations}
            selectPlace={this.selectPlace}
          />
        </section>
        {/* GoogleMap component - By default adds map with markers for  all the places on UI */}
        <GoogleMap
          locations={filteredLocations}
          filterText={filterQuery}
          selectedPlaceTitle={selectedPlaceTitle}
        />
      </main>
    );
  }
}

export default Search;
