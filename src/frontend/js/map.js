// map.js - Interactive 3D Campus Map for Wits University with Pathfinding

class WitsCampusMap {
    constructor() {
        // Mapbox access token
        mapboxgl.accessToken = 'pk.eyJ1IjoidGVib2dvMTI4OSIsImEiOiJjbWVlamM0M2QwOXV4MmxzaW82OXFlc3IyIn0.ist6kRSEUaqUzvdMrLXuIQ';
        
        // Campus coordinates (University of the Witwatersrand)
        this.campusCenter = [28.0305, -26.1929]; // [lng, lat]
        
        // Map instance
        this.map = null;
        
        // Pathfinding service
        this.pathfindingClient = null;
        
        // Campus venues/buildings data - Updated with all notable buildings
        this.campusVenues = [
            // East Campus
            { id: 'great-hall', name: 'Great Hall', coordinates: [28.030374, -26.191809] },
            { id: 'solomon-mahlangu', name: 'Solomon Mahlangu House', coordinates: [28.030618, -26.192717] },
            { id: 'wartenweiler-library', name: 'Wartenweiler Library', coordinates: [28.030784, -26.191099] },
            { id: 'matrix-union', name: 'The Matrix', coordinates: [28.030744, -26.190004] },
            { id: 'origins-centre', name: 'Origins Centre', coordinates: [ 28.028362, -26.192953] },
            { id: 'bidvest-stadium', name: 'Bidvest Stadium', coordinates: [28.0330, -26.1905] },
            { id: 'planetarium', name: 'Wits Anglo American Digital Dome', coordinates: [28.028316, -26.188472] },
            { id: 'mens-res', name: "Men's Residence", coordinates: [ 28.030410, -26.188852] },
            { id: 'mens-res', name: "Men's Residence", coordinates: [ 28.029517, -26.188880] },
            { id: 'library-lawns', name: "Library Lawns", coordinates: [ 28.030053, -26.190707] },
            { id: 'sunnyside', name: 'Sunnyside Residence', coordinates: [ 28.031615, -26.189722] },
            { id: 'jubilee', name: 'Jubilee Hall', coordinates: [28.032408, -26.188388] },
            { id: 'rsb', name: 'RSB', coordinates: [28.030376, -26.192157] },
            { id: 'wcco', name: 'WCCO', coordinates: [ 28.030786, -26.188163] },
            { id: 'dj-du-plessis', name: 'DJ du Plessis', coordinates: [28.024073, -26.188209] },
            { id: 'john-moffat', name: 'John Moffat', coordinates: [28.029308, -26.190220] },
            { id: 'william-library', name: 'William Cullen Library', coordinates: [ 28.029362, -26.190694] },
            { id: 'clinic', name: 'Wits Clinic', coordinates: [28.031371, -26.190398] },
            { id: 'umthombo-building', name: 'Umthombo Building', coordinates: [28.030708, -26.190502] },
            { id: 'old-mutual', name: 'Old Mutual Sports Hall', coordinates: [28.029247, -26.189600] },
            { id: 'amic-dec', name: 'Amic Dec', coordinates: [28.028330, -26.190989] },
            { id: 'rugby-stadium', name: 'Wits Rugby Stadium', coordinates: [28.030957, -26.187265] },
            { id: 'fnb-stadium', name: 'Wits FNB Stadium', coordinates: [28.028122, -26.188172] },
            { id: 'biology', name: 'Biology', coordinates: [28.031558, -26.190959] },
            { id: 'ols', name: 'OLS', coordinates: [28.032013, -26.191473] },
            { id: 'gatehouse', name: 'Gatehouse', coordinates: [28.031998, -26.192003] },
            { id: 'wits-theater', name: 'Wits Theater', coordinates: [28.031724, -26.192798] },
            { id: 'wits-school-of-art', name: 'Wits School of the Art', coordinates: [28.032859, -26.192060] },
            { id: 'wits-art-museum', name: 'Wits Art Museum', coordinates: [28.032651, -26.192799] },
            { id: 'humphrey-raikes', name: 'Humphrey Raikes', coordinates: [28.031162, -26.192109] },
            { id: 'international-house', name: 'International House', coordinates: [28.0325, -26.1950] },

            // West Campus
            { id: 'chamber-mines', name: 'ARM Building', coordinates: [28.027219, -26.191756] },
            { id: 'commerce-building', name: 'Commerce Building', coordinates: [28.026376, -26.189375] },
            { id: 'law-building', name: 'Law Building', coordinates: [28.0280, -26.1925] },
            { id: 'management-building', name: 'Management Building', coordinates: [28.0282, -26.1928] },
            { id: 'kambule-building', name: 'TW Kambule MSB', coordinates: [ 28.026542, -26.190125] },
            { id: 'barnato-residence', name: 'Barnato Residence', coordinates: [ 28.025023, -26.1869235] },
            { id: 'david-webster', name: 'David Webster Residence', coordinates: [ 28.025968, -26.186825] },
            { id: 'west-village', name: 'West Campus Village', coordinates: [28.023995, -26.187372] },
            { id: 'convocation-dh', name: 'Convocation DH', coordinates: [ 28.024077, -26.186835] },
            { id: 'main-dh', name: 'Main DH', coordinates: [ 28.030731, -26.189531] },
            { id: 'flower-hall', name: 'Flower Hall', coordinates: [28.026051, -26.191734] },
            { id: 'tower-building', name: 'Tower Building', coordinates: [ 28.025879, -26.189633] },
            { id: 'fnb-building', name: 'FNB Building', coordinates: [ 28.026673, -26.188551] },
            { id: 'new-commerce-building', name: 'NCB', coordinates: [  28.026597, -26.189738] },
            { id: 'msl', name: 'MSL', coordinates: [ 28.026814, -26.190504] },
            { id: 'physics-labs', name: 'Physics Labs', coordinates: [ 28.025928, -26.190838] },
            { id: 'physics-building', name: 'Physics Building', coordinates: [28.031225, -26.191683] },
            { id: 'science-stadium', name: 'Science Stadium', coordinates: [ 28.025167, -26.190533] },
            { id: 'hall-29', name: 'Hall 29', coordinates: [ 28.025988, -26.186331] },
            { id: 'gym-courts', name: 'Gym and Squash Coutrs', coordinates: [28.026890, -26.186250] },
            { id: "Jimmy's'", name: "Jimmy's", coordinates: [28.025950, -26.188774] },
            { id: "pimd", name: "PIMD", coordinates: [28.024261, -26.188963] },
            { id: "chamber", name: "Chamber of Mines", coordinates: [28.026775, -26.191645] },
            { id: "genmin-lab", name: "Genmin Lab", coordinates: [28.025928, -26.191311] },
            { id: "high-voltage-lab", name: "High Voltage Lab", coordinates: [ 28.025696, -26.191584] },
            { id: 'wits-postgrad-club', name: 'Wits Postgraduates Club', coordinates: [28.028741, -26.192436] },
            { id: 'wits-law-clinic', name: 'Wits Law Clinic', coordinates: [  28.025277, -26.189251] },
            { id: 'commerce-library', name: 'Commerce Library', coordinates: [28.025627, -26.189442] },
            { id: 'ccdu', name: 'CCDU', coordinates: [ 28.026995, -26.190858] },
        ];
        
        // Known pathways and walkable areas (approximate coordinates)
        this.pathways = [
            // Main walkways
            { name: "Main East Walkway", coordinates: [
                [28.0305, -26.1935], [28.0305, -26.1920], [28.0305, -26.1900], [28.0305, -26.1885]
            ]},
            { name: "Library Walkway", coordinates: [
                [28.0295, -26.1910], [28.0305, -26.1910], [28.0315, -26.1910]
            ]},
            { name: "West Campus Connector", coordinates: [
                [28.0265, -26.1915], [28.0265, -26.1900], [28.0265, -26.1885], [28.0265, -26.1870]
            ]},
            { name: "North-South Connector", coordinates: [
                [28.0280, -26.1920], [28.0280, -26.1900], [28.0280, -26.1880]
            ]},
            { name: "Matrix Plaza", coordinates: [
                [28.0305, -26.1895], [28.0310, -26.1895], [28.0315, -26.1895]
            ]},
            { name: "Commerce Square", coordinates: [
                [28.0260, -26.1895], [28.0265, -26.1895], [28.0270, -26.1895]
            ]}
        ];
        
        // Route data
        this.currentRoute = null;
        this.routeMarkers = [];
        
        // Initialize the map
        this.init();
    }
    
    // Initialize the application
    init() {
        this.showLoading();
        this.setupEventListeners();
        this.initializeMap();
        this.populateVenueSelects();
        this.initializePathfinding();
    }
    
    // Setup event listeners for UI interactions
    setupEventListeners() {
        // Navigation panel controls
        document.getElementById('showNavigationBtn').addEventListener('click', () => this.toggleNavigationPanel());
        document.getElementById('closePanel').addEventListener('click', () => this.hideNavigationPanel());
        
        // Map controls
        document.getElementById('locateBtn').addEventListener('click', () => this.locateUser());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetMapView());
        
        // Navigation controls
        document.getElementById('getDirectionsBtn').addEventListener('click', () => this.getDirections());
        document.getElementById('clearDirectionsBtn').addEventListener('click', () => this.clearDirections());
        
        // Close navigation panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.querySelector('.navigation-panel');
            const showBtn = document.getElementById('showNavigationBtn');
            
            if (panel.classList.contains('active') && 
                !panel.contains(e.target) && 
                !showBtn.contains(e.target)) {
                this.hideNavigationPanel();
            }
        });
    }
    
    // Initialize Mapbox map
    initializeMap() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: this.campusCenter,
            zoom: 17,
            pitch: 60,
            bearing: -20,
            antialias: true,
            optimizeForTerrain: true
        });
        
        // Add map controls
        this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        this.map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        
        // Wait for map to load
        this.map.on('load', () => {
            this.add3DBuildings();
            this.addCampusMarkers();
            this.addPathwayLayers();
            this.hideLoading();
        });
        
        // Handle map errors
        this.map.on('error', (e) => {
            console.error('Map error:', e);
            this.showError('Failed to load map. Please refresh the page.');
            this.hideLoading();
        });
    }
    
    // Add 3D buildings to the map
    add3DBuildings() {
        // Add terrain source for 3D effect
        this.map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
        
        // Set terrain with enhanced 3D effect
        this.map.setTerrain({ 
            'source': 'mapbox-dem', 
            'exaggeration': 2.0 
        });
        
        // Add enhanced 3D buildings layer
        this.map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 14,
            'paint': {
                'fill-extrusion-color': [
                    'case',
                    ['>', ['get', 'height'], 100],
                    '#1e40af', // Tall buildings - dark blue
                    ['>', ['get', 'height'], 50],
                    '#3b82f6', // Medium buildings - blue
                    '#60a5fa'  // Short buildings - light blue
                ],
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14, 0,
                    14.5, ['*', ['get', 'height'], 1.2]
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14, 0,
                    14.5, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.9,
                'fill-extrusion-ambient-occlusion-intensity': 0.3,
                'fill-extrusion-flood-light-intensity': 0.8
            }
        });
        
        // Add sky layer for atmosphere
        this.map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });
        
        // Configure enhanced lighting for 3D buildings
        this.map.setLight({
            'anchor': 'viewport',
            'color': '#ffffff',
            'intensity': 0.6,
            'position': [1.5, 90, 60]
        });
        
        // Add building interaction
        this.map.on('click', '3d-buildings', (e) => {
            const building = e.features[0];
            if (building) {
                this.showBuildingInfo(building, e.lngLat);
            }
        });
        
        // Change cursor on building hover
        this.map.on('mouseenter', '3d-buildings', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', '3d-buildings', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }
    
    // Add pathway layers to the map
    addPathwayLayers() {
        // Add pathway data source
        this.map.addSource('pathways', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': this.pathways.map(pathway => ({
                    'type': 'Feature',
                    'properties': {
                        'name': pathway.name
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': pathway.coordinates
                    }
                }))
            }
        });
        
        // Add pathway layer
        this.map.addLayer({
            'id': 'pathways',
            'type': 'line',
            'source': 'pathways',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#888',
                'line-width': 3,
                'line-opacity': 0.7
            }
        });
    }
    
    // Add campus venue markers
    addCampusMarkers() {
        this.campusVenues.forEach(venue => {
            // Create marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'campus-marker';
            markerElement.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: 0 2px 10px rgba(52, 152, 219, 0.4);
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='scale(1.1)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-building" style="margin-right: 5px;"></i>
                    ${venue.name}
                </div>
            `;
            
            // Create popup
            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false
            }).setHTML(`
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 10px 0; color: #3498db;">${venue.name}</h3>
                    <button onclick="witsMap.setAsStart('${venue.id}')" 
                            style="background: #27ae60; color: white; border: none; padding: 5px 10px; 
                                   border-radius: 5px; margin-right: 5px; cursor: pointer;">
                        Set as Start
                    </button>
                    <button onclick="witsMap.setAsDestination('${venue.id}')" 
                            style="background: #e74c3c; color: white; border: none; padding: 5px 10px; 
                                   border-radius: 5px; cursor: pointer;">
                        Set as Destination
                    </button>
                </div>
            `);
            
            // Create and add marker
            const marker = new mapboxgl.Marker(markerElement)
                .setLngLat(venue.coordinates)
                .setPopup(popup)
                .addTo(this.map);
            
            venue.marker = marker;
        });
    }
    
    // Initialize pathfinding service
    initializePathfinding() {
        // In a real implementation, you would connect to a pathfinding service here
        // For this example, we'll use a simplified approach that snaps to pathways
        console.log("Pathfinding service initialized");
    }
    
    // Populate venue select dropdowns
    populateVenueSelects() {
        const startSelect = document.getElementById('startLocation');
        const endSelect = document.getElementById('endLocation');
        
        // Clear existing options
        startSelect.innerHTML = '<option value="">Select starting point</option>';
        endSelect.innerHTML = '<option value="">Select destination</option>';
        
        this.campusVenues.forEach(venue => {
            // Add to start location dropdown
            const startOption = document.createElement('option');
            startOption.value = venue.id;
            startOption.textContent = venue.name;
            startSelect.appendChild(startOption);
            
            // Add to end location dropdown
            const endOption = document.createElement('option');
            endOption.value = venue.id;
            endOption.textContent = venue.name;
            endSelect.appendChild(endOption);
        });
    }
    
    // Get directions between selected venues
    getDirections() {
        const startId = document.getElementById('startLocation').value;
        const endId = document.getElementById('endLocation').value;
        
        if (!startId || !endId) {
            this.showError('Please select both start and destination locations.');
            return;
        }
        
        if (startId === endId) {
            this.showError('Start and destination cannot be the same.');
            return;
        }
        
        const startVenue = this.campusVenues.find(v => v.id === startId);
        const endVenue = this.campusVenues.find(v => v.id === endId);
        
        this.showLoading();
        this.calculateSmartRoute(startVenue, endVenue);
    }
    
    // Calculate route that follows pathways and avoids buildings
    calculateSmartRoute(startVenue, endVenue) {
        // In a production environment, you would use a proper pathfinding algorithm
        // Here we implement a simplified version that:
        // 1. Finds the nearest pathway points to start and end
        // 2. Finds a path through the pathway network
        // 3. Connects the start/end points to the pathway network
        
        // Get nearest pathway points
        const startPoint = this.findNearestPathwayPoint(startVenue.coordinates);
        const endPoint = this.findNearestPathwayPoint(endVenue.coordinates);
        
        // Find path through pathway network
        const pathwayPath = this.findPathThroughPathways(startPoint, endPoint);
        
        if (pathwayPath.length === 0) {
            // Fallback to straight line if no pathway found
            this.drawStraightLineRoute(startVenue, endVenue);
            return;
        }
        
        // Combine the full route: start -> pathway start -> pathway path -> pathway end -> end
        const fullPath = [
            startVenue.coordinates,
            ...pathwayPath,
            endVenue.coordinates
        ];
        
        // Display the route
        this.displaySmartRoute(fullPath, startVenue, endVenue);
    }
    
    // Find the nearest point on any pathway to the given coordinates
    findNearestPathwayPoint(coordinates) {
        let nearestPoint = null;
        let minDistance = Infinity;
        
        // Check all pathway segments
        for (const pathway of this.pathways) {
            for (let i = 0; i < pathway.coordinates.length - 1; i++) {
                const segmentStart = pathway.coordinates[i];
                const segmentEnd = pathway.coordinates[i + 1];
                
                // Find closest point on this segment
                const closest = this.closestPointOnSegment(
                    coordinates,
                    segmentStart,
                    segmentEnd
                );
                
                // Calculate distance
                const distance = this.calculateDistance(
                    coordinates[0], coordinates[1],
                    closest[0], closest[1]
                );
                
                // Update nearest point if this is closer
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = closest;
                }
            }
        }
        
        return nearestPoint || coordinates; // Fallback to original if no pathways found
    }
    
    // Find the closest point on a line segment to a point
    closestPointOnSegment(point, segmentStart, segmentEnd) {
        const x = point[0], y = point[1];
        const x1 = segmentStart[0], y1 = segmentStart[1];
        const x2 = segmentEnd[0], y2 = segmentEnd[1];
        
        // Calculate the length of the segment squared
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return [x1, y1]; // segment is a point
        
        // Calculate the projection of point onto the segment
        let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t)); // clamp to segment
        
        return [
            x1 + t * (x2 - x1),
            y1 + t * (y2 - y1)
        ];
    }
    
    // Find a path through the pathway network (simplified)
    findPathThroughPathways(start, end) {
        // This is a simplified pathfinding implementation
        // In a real application, you would use a proper graph search algorithm
        
        // Find the pathways closest to start and end
        const startPathway = this.findClosestPathway(start);
        const endPathway = this.findClosestPathway(end);
        
        if (!startPathway || !endPathway) return [];
        
        // If both points are on the same pathway, just connect them directly
        if (startPathway === endPathway) {
            return [start, end];
        }
        
        // Otherwise find a connection between pathways
        // This is a simplified version - in reality you'd need a proper graph of connections
        // Here we just find the intersection point between two pathways if they cross
        
        // Find intersection between pathways
        const intersection = this.findPathwayIntersection(startPathway, endPathway);
        
        if (intersection) {
            return [start, intersection, end];
        }
        
        // Fallback - connect via campus center if no intersection found
        return [start, this.campusCenter, end];
    }
    
    // Find the pathway closest to a point
    findClosestPathway(point) {
        let closestPathway = null;
        let minDistance = Infinity;
        
        for (const pathway of this.pathways) {
            for (const coord of pathway.coordinates) {
                const distance = this.calculateDistance(
                    point[0], point[1],
                    coord[0], coord[1]
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPathway = pathway;
                }
            }
        }
        
        return closestPathway;
    }
    
    // Find intersection point between two pathways (if any)
    findPathwayIntersection(pathway1, pathway2) {
        // Check all segments of pathway1 against all segments of pathway2
        for (let i = 0; i < pathway1.coordinates.length - 1; i++) {
            const p1 = pathway1.coordinates[i];
            const p2 = pathway1.coordinates[i + 1];
            
            for (let j = 0; j < pathway2.coordinates.length - 1; j++) {
                const p3 = pathway2.coordinates[j];
                const p4 = pathway2.coordinates[j + 1];
                
                const intersection = this.lineIntersection(p1, p2, p3, p4);
                if (intersection) return intersection;
            }
        }
        
        return null;
    }
    
    // Calculate intersection point of two line segments
    lineIntersection(p1, p2, p3, p4) {
        // Line segment intersection algorithm
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1];
        const x4 = p4[0], y4 = p4[1];
        
        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        
        // Lines are parallel
        if (denominator === 0) return null;
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
        
        // Is the intersection within the segments?
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return [
                x1 + ua * (x2 - x1),
                y1 + ua * (y2 - y1)
            ];
        }
        
        return null;
    }
    
    // Display the smart route on the map
    displaySmartRoute(routeCoordinates, startVenue, endVenue) {
        // Clear any existing route
        this.clearRouteFromMap();
        
        // Add the route source
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates
                }
            }
        });
        
        // Add the route layer
        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#3b82f6',
                'line-width': 6,
                'line-opacity': 0.9,
                'line-dasharray': [0.5, 0.5]
            }
        });
        
        // Add start and end markers
        this.addRouteMarkers(startVenue, endVenue);
        
        // Fit the map to the route bounds
        const bounds = new mapboxgl.LngLatBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord));
        this.map.fitBounds(bounds, { padding: 50 });
        
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            totalDistance += this.calculateDistance(
                routeCoordinates[i][0], routeCoordinates[i][1],
                routeCoordinates[i + 1][0], routeCoordinates[i + 1][1]
            );
        }
        
        // Display route information
        const directionsPanel = document.getElementById('directionsPanel');
        const routeSummary = document.getElementById('routeSummary');
        const routeSteps = document.getElementById('routeSteps');
        
        routeSummary.innerHTML = `
            <h3>Route from ${startVenue.name} to ${endVenue.name}</h3>
            <p><strong>Distance:</strong> ${totalDistance.toFixed(0)} meters</p>
            <p><strong>Path Type:</strong> Campus Pathway</p>
        `;
        
        // Generate simplified directions
        routeSteps.innerHTML = `
            <div class="route-step">
                <div class="step-number">1</div>
                <div class="step-instruction">Start at ${startVenue.name}</div>
            </div>
            <div class="route-step">
                <div class="step-number">2</div>
                <div class="step-instruction">Follow the highlighted pathway</div>
            </div>
            <div class="route-step">
                <div class="step-number">3</div>
                <div class="step-instruction">Arrive at ${endVenue.name}</div>
            </div>
        `;
        
        // Show the directions panel
        directionsPanel.classList.add('active');
        this.hideLoading();
    }
    
    // Draw straight line route (fallback)
    drawStraightLineRoute(startVenue, endVenue) {
        const routeCoordinates = [startVenue.coordinates, endVenue.coordinates];
        
        // Clear previous route
        this.clearRouteFromMap();
        
        // Add the route source
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates
                }
            }
        });
        
        // Add the route layer
        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.8
            }
        });
        
        // Add start and end markers
        this.addRouteMarkers(startVenue, endVenue);
        
        // Fit the map to the route bounds
        const bounds = new mapboxgl.LngLatBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord));
        this.map.fitBounds(bounds, { padding: 50 });
        
        // Calculate distance
        const distance = this.calculateDistance(
            startVenue.coordinates[0], startVenue.coordinates[1],
            endVenue.coordinates[0], endVenue.coordinates[1]
        );
        
        // Display route information
        const directionsPanel = document.getElementById('directionsPanel');
        const routeSummary = document.getElementById('routeSummary');
        const routeSteps = document.getElementById('routeSteps');
        
        routeSummary.innerHTML = `
            <h3>Straight-line path from ${startVenue.name} to ${endVenue.name}</h3>
            <p><strong>Distance:</strong> ${distance.toFixed(0)} meters</p>
            <p><em>Following campus pathways not available</em></p>
        `;
        
        routeSteps.innerHTML = '<p>For detailed walking directions, please follow visible pathways on campus.</p>';
        directionsPanel.classList.add('active');
        
        this.hideLoading();
    }
    
    // Add start and end markers for the route
    addRouteMarkers(startVenue, endVenue) {
        // Clear existing route markers
        this.routeMarkers.forEach(marker => marker.remove());
        this.routeMarkers = [];
        
        // Start marker
        const startMarker = new mapboxgl.Marker({
            color: '#27ae60',
            scale: 1.2
        })
        .setLngLat(startVenue.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Start: ${startVenue.name}</h3>`))
        .addTo(this.map);
        
        // End marker
        const endMarker = new mapboxgl.Marker({
            color: '#e74c3c',
            scale: 1.2
        })
        .setLngLat(endVenue.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Destination: ${endVenue.name}</h3>`))
        .addTo(this.map);
        
        this.routeMarkers = [startMarker, endMarker];
    }
    
    // Clear current route
    clearDirections() {
        this.clearRouteFromMap();
        document.getElementById('directionsPanel').classList.remove('active');
        document.getElementById('startLocation').value = '';
        document.getElementById('endLocation').value = '';
    }
    
    // Clear route from map
    clearRouteFromMap() {
        // Remove all route layers
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        
        // Remove route markers
        this.routeMarkers.forEach(marker => marker.remove());
        this.routeMarkers = [];
    }
    // Show building info when clicked
// Show building info when clicked
showBuildingInfo(building, lngLat) {
    const height = building.properties.height || 'Unknown';
    const levels = building.properties.level || 'Unknown';
    const coordinates = lngLat; // This contains [longitude, latitude]
    
    new mapboxgl.Popup({
        closeOnClick: true,
        closeButton: true
    })
    .setLngLat(lngLat)
    .setHTML(`
        <div style="padding: 16px; min-width: 200px;">
            <h3 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 18px;">
                <i class="fas fa-building"></i> Building Info
            </h3>
            <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Coordinates:</strong> ${coordinates.lng.toFixed(6)}, ${coordinates.lat.toFixed(6)}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Height:</strong> ${height}m</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Levels:</strong> ${levels}</p>
            </div>
            <button onclick="this.closest('.mapboxgl-popup').remove()" 
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; 
                           border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `)
    .addTo(this.map);
}
    // Set venue as start location
    setAsStart(venueId) {
        document.getElementById('startLocation').value = venueId;
        this.showNavigationPanel();
    }
    
    // Set venue as destination
    setAsDestination(venueId) {
        document.getElementById('endLocation').value = venueId;
        this.showNavigationPanel();
    }
    
    // Toggle navigation panel
    toggleNavigationPanel() {
        const panel = document.querySelector('.navigation-panel');
        panel.classList.toggle('active');
    }
    
    // Show navigation panel
    showNavigationPanel() {
        document.querySelector('.navigation-panel').classList.add('active');
    }
    
    // Hide navigation panel
    hideNavigationPanel() {
        document.querySelector('.navigation-panel').classList.remove('active');
    }
    
    // Locate user on map
    locateUser() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser.');
            return;
        }
        
        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.longitude, position.coords.latitude];
                
                // Add user location marker
                new mapboxgl.Marker({
                    color: '#f39c12',
                    scale: 1.2
                })
                .setLngLat(userLocation)
                .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3>'))
                .addTo(this.map);
                
                // Fly to user location
                this.map.flyTo({
                    center: userLocation,
                    zoom: 17,
                    duration: 2000
                });
                
                this.hideLoading();
            },
            (error) => {
                this.hideLoading();
                this.showError('Unable to retrieve your location: ' + error.message);
            }
        );
    }
    
    // Reset map view to campus center
    resetMapView() {
        this.map.flyTo({
            center: this.campusCenter,
            zoom: 17,
            pitch: 60,
            bearing: -20,
            duration: 2000
        });
    }
    
    // Utility: Decode Google Maps polyline
    decodePolyline(encoded) {
        const points = [];
        let index = 0;
        const len = encoded.length;
        let lat = 0;
        let lng = 0;
        
        while (index < len) {
            let b;
            let shift = 0;
            let result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            
            shift = 0;
            result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            
            points.push([lng / 1e5, lat / 1e5]);
        }
        
        return points;
    }
    
    // Utility: Calculate distance between two points
    calculateDistance(lng1, lat1, lng2, lat2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // Show loading indicator
    showLoading() {
        document.getElementById('loadingIndicator').classList.add('active');
    }
    
    // Hide loading indicator
    hideLoading() {
        document.getElementById('loadingIndicator').classList.remove('active');
    }
    
    // Show error message
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        document.getElementById('errorText').textContent = message;
        errorElement.classList.add('active');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.classList.remove('active');
        }, 5000);
    }
}

// Initialize the map when page loads
let witsMap;
document.addEventListener('DOMContentLoaded', () => {
    witsMap = new WitsCampusMap();
});