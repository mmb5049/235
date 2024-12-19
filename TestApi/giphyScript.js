  // 1
  window.onload = (e) => {
    let prefix = "mmb5049-"
    let savedTerm = localStorage.getItem(prefix + "searchTerms");
    let searchHistory = JSON.parse(localStorage.getItem(prefix + "searchTerms")) || [];
    displaySearchHistory(searchHistory);
   
    document.querySelector("#search").onclick = () => searchButtonClicked(false);

    document.querySelector("#sortOrder").addEventListener("change", () => {
        searchButtonClicked();
    });
    document.querySelector("#viewFavorites").onclick = favorite
    
    // Attach event listener to "Load More" button
    document.querySelector("#loadMore").addEventListener("click", () => {
    offset += limit; // Increment the offset by the limit
    searchButtonClicked(true); // Fetch more results without clearing existing ones
    });

    document.querySelector("#ratingFilter select").addEventListener("change", () => {
        searchButtonClicked(false); // New search triggered
    });
};

// Function to update and display search history
function displaySearchHistory(searchHistory) {
    let searchList = document.querySelector("#searchTermsList");
    searchList.innerHTML = ""; // Clear the existing list

    searchHistory.forEach(term => {
        let li = document.createElement("li");
        li.textContent = term;
        // Add click event to each search term in history
        li.onclick = () => {
            document.querySelector("#searchterm").value = term; // Set the input value to the clicked term
            searchButtonClicked(); // Trigger a new search for that term
        };

        searchList.appendChild(li);
    });
}
	
 // 2
 let displayTerm = "";
 
 // 3
 // Initial limit for search results
 let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let limit = 6;

// Default offset to handle "Load More" functionality
let offset = 0;

let termsToSearch = 200;

let allResults = []; // Store all fetched GIFs

function searchButtonClicked(loadMore = false) {
    console.log("searchButtonClicked() called");

    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";
    let GIPHY_KEY = "9VmdRyEluddl53rurVe64jPaKKNJKYTj";
    let url = GIPHY_URL + "api_key=" + GIPHY_KEY;

    let term = document.querySelector("#searchterm").value.trim();
    displayTerm = term;

    if (!loadMore) {
        offset = 0; // Reset offset if it's a new search
        document.querySelector("#content").innerHTML = ""; // Clear previous results
    }

    term = term.trim();
    saveSearchTerm(term);
    let encodedTerm = encodeURIComponent(term); // Encoded term for URL
    
    if (term.length < 1) return;

    // Get the selected rating
    let rating = document.querySelector("#ratingFilter select").value;

    url += `&q=` + encodedTerm;
    url += `&limit=${termsToSearch}&offset=${offset}`;

    if (rating) {
        url += `&rating=${rating}`;
    }

    document.querySelector("#status").innerHTML = `<b>Searching for '${displayTerm}'</b>`;
    console.log(url);

    getData(url);

    function getData(url) {
        let xhr = new XMLHttpRequest();
        xhr.onload = dataLoaded;
        xhr.onerror = dataError;
        xhr.open("GET", url);
        xhr.send();
    }

    
}



function dataLoaded(e) {
    let xhr = e.target;

    let obj = JSON.parse(xhr.responseText);

    if (!obj.data || obj.data.length == 0) {
        document.querySelector("#status").innerHTML = `<b>No result found for '${displayTerm}'</b>`;
        document.querySelector("#loadMore").style.display = "none"; // Hide "Load More" button if no results
        return;
    }

    let results = obj.data;

    let resultsToDisplay = [];

    // Strict filtering for selected rating
    let selectedRating = document.querySelector("#ratingFilter select").value;
    if (selectedRating) {
        results = results.filter(result => result.rating.toUpperCase() === selectedRating.toUpperCase());
    }

    // Display text to let the user know if there are no gifs for specific rating
    if (results.length === 0) {
        document.querySelector("#status").innerHTML = `<b>No results found for '${displayTerm}' with rating '${selectedRating}'</b>`;
        document.querySelector("#loadMore").style.display = "none"; // Hide "Load More" button
        return;
    }
    
    // Sort all results in alphabetical or by date
    let sortOrder = document.querySelector("#sortOrder").value;
    if (sortOrder === "az") {
        results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "za") {
        results.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOrder === "newest") {
        results.sort((a, b) => new Date(b.import_datetime) - new Date(a.import_datetime));
    } else if (sortOrder === "oldest") {
        results.sort((a, b) => new Date(a.import_datetime) - new Date(b.import_datetime));
    }

     // Display the current batch based on offset and limit
     let start = offset; // Start index for this batch
     let end = offset + limit; // End index for this batch
     offset += limit; // Update offset for the next batch
    
     for (let i = start; i < end && i < results.length; i++) {
        // Check if a result with the same title already exists
        if (!resultsToDisplay.some(existingResult => existingResult.title === results[i].title)) {
            resultsToDisplay.push(results[i]); // Add only unique titles
        }
        
    
    }

    let bigString = "";

    resultsToDisplay.forEach(result => {

        // get data and format it
        let smallURL = result.images.fixed_width_downsampled.url;
        if (!smallURL) smallURL = "images/no-image-found.png";
        let title = result.title || "No Title Available";
        let importDate = result.import_datetime || "No Date Available";
        if (importDate !== "No Date Available") {
            let date = new Date(importDate);
            importDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }
        let rating = result.rating.length < 1 ? "NA" : result.rating.toUpperCase();
        let gifID = result.id;
        let isFavorite = favorites.includes(gifID) ? "⭐" : "☆";


        let line = `<div class='result'>
                        <img src='${smallURL}' title='${gifID}' />
                        <div class='text-content'>
                            <span style = "font-weight: light">${title}</span>
                            <div class='import-date'>Imported on: ${importDate}</div>
                            <div class='rating'>Rating: ${rating}</div>
                            <div class='favorite' data-id='${gifID}' style='cursor:pointer;'>${isFavorite} Favorite</div>
                        </div>
                    </div>`;

        bigString += line;
    });

    // display it in html
    document.querySelector("#content").innerHTML += bigString; // Append new results
    document.querySelector("#status").innerHTML = `<b>Success!</b> <p><i>Here are more results for '${displayTerm}'</i></p>`;

    // Show "Load More" button if results are still available
    document.querySelector("#loadMore").style.display = obj.pagination.total_count > offset + limit ? "block" : "none";
}

function dataError(e) {
    console.log("An error has occurred");
}

 // Save the search term to localStorage, checking if it already exists
function saveSearchTerm(term) {
    let prefix = "mmb5049-";
    let storedTerms = JSON.parse(localStorage.getItem(prefix + "searchTerms")) || [];

    // Check if the term already exists
    if (!storedTerms.includes(term)) {
        storedTerms.push(term); // Add the new term
        localStorage.setItem(prefix + "searchTerms", JSON.stringify(storedTerms)); // Save updated list
        loadSearchTerms(); // Update the displayed list of terms
    }
}

// Load and display search terms from localStorage
function loadSearchTerms() {
    let prefix = "mmb5049-";
    let storedTerms = JSON.parse(localStorage.getItem(prefix + "searchTerms")) || [];

    let searchTermsList = document.querySelector("#searchTermsList");
    searchTermsList.innerHTML = ""; // Clear the list first

    // Display each search term
    storedTerms.forEach(term => {
        let listItem = document.createElement("li");
        listItem.textContent = term;
        searchTermsList.appendChild(listItem);
    });
}



// Function to handle clicking the star icon to add/remove favorites
document.addEventListener("click", function(e) {
    if (e.target && e.target.classList.contains("favorite")) {
        let gifID = e.target.getAttribute("data-id");

        // Prevent adding 'null' or invalid IDs to the favorites
        if (!gifID) return;

        // If it's already a favorite, remove it; otherwise, add it
        if (favorites.includes(gifID)) {
            favorites = favorites.filter(fav => fav !== gifID);
            e.target.innerHTML = "☆ Favorite"; // Change to empty star
        } else {
            favorites.push(gifID);
            e.target.innerHTML = "⭐ Favorite"; // Change to filled star
        }

        // Save the updated favorites list to localStorage
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }
});


function favorite() {
    let bigString = "";

    
    // Fetch all favorite GIFs from the API (assuming their IDs are stored)
    favorites.forEach(gifID => {
        const GIPHY_URL = `https://api.giphy.com/v1/gifs/${gifID}?api_key=9VmdRyEluddl53rurVe64jPaKKNJKYTj`;
        
        // this is for testing api
        // const GIPHY_URL = `https:api.giphy.com/v1/gifs/${gifID}?api_key=5PuWjWVnwpHUQPZK866vd7wQ2qeCeqg7`;

        let xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            let obj = JSON.parse(e.target.responseText);
            let result = obj.data;

            // get and parse data
            let smallURL = (result.images && result.images.fixed_width_downsampled) ? result.images.fixed_width_downsampled.url : "media/no-image-found.jpeg";

            let title = result.title || "No Title Available";
            let importDate = result.import_datetime || "No Date Available";

            let rating = result.rating ? result.rating.toUpperCase() : "NA";

            let isFavorite = favorites.includes(result.id) ? "⭐" : "☆";

            let line = `<div class= 'result'>
                            <img src= '${smallURL}' title= '${result.id}' />
                            <div class='text-content'>
                                <span>${title}</span>
                                <div class='import-date'>Imported on: ${importDate}</div>
                                <div class='rating'>Rating: ${rating}</div>
                                 <div class='favorite' data-id='${gifID}' style='cursor:pointer;'>${isFavorite} Favorite</div>
                        </div>
                            </div>
                        </div>`;

            bigString += line;

            // Display favorite GIFs
            document.querySelector("#content").innerHTML = bigString;
        };

        xhr.open("GET", GIPHY_URL);
        xhr.send();
    });

    // info for user to understand where they are at
    if (favorites.length === 0) {
        document.querySelector("#content").innerHTML = "<p>No favorite GIFs yet!</p>";
    }
     // Hide the Load More button
     document.querySelector("#loadMore").style.display = "none";

     // Update the status
     document.querySelector("#status").innerHTML = "<b>Viewing Your Favorite GIFs</b>";
};