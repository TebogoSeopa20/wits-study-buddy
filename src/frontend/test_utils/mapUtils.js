// mapUtils.js - Utility functions for Wits Campus Map

// Mapbox access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidGVib2dvMTI4OSIsImEiOiJjbWVlamM0M2QwOXV4MmxzaW82OXFlc3IyIn0.ist6kRSEUaqUzvdMrLXuIQ';

// Campus coordinates (University of the Witwatersrand)
const CAMPUS_CENTER = [28.0305, -26.1929]; // [lng, lat]

// Campus venues/buildings data
const CAMPUS_VENUES = [
    // East Campus
    { id: 'great-hall', name: 'Great Hall', coordinates: [28.030374, -26.191809] },
    { id: 'solomon-mahlangu', name: 'Solomon Mahlangu House', coordinates: [28.030618, -26.192717] },
    { id: 'wartenweiler-library', name: 'Wartenweiler Library', coordinates: [28.030784, -26.191099] },
    { id: 'matrix-union', name: 'The Matrix', coordinates: [28.030744, -26.190004] },
    { id: 'origins-centre', name: 'Origins Centre', coordinates: [28.028362, -26.192953] },
    { id: 'bidvest-stadium', name: 'Bidvest Stadium', coordinates: [28.0330, -26.1905] },
    { id: 'planetarium', name: 'Wits Anglo American Digital Dome', coordinates: [28.028316, -26.188472] },
    { id: 'mens-res', name: "Men's Residence", coordinates: [28.030410, -26.188852] },
    { id: 'mens-res-2', name: "Men's Residence 2", coordinates: [28.029517, -26.188880] },
    { id: 'library-lawns', name: "Library Lawns", coordinates: [28.030053, -26.190707] },
    { id: 'sunnyside', name: 'Sunnyside Residence', coordinates: [28.031615, -26.189722] },
    { id: 'jubilee', name: 'Jubilee Hall', coordinates: [28.032408, -26.188388] },
    { id: 'rsb', name: 'RSB', coordinates: [28.030376, -26.192157] },
    { id: 'thembi', name: 'Thembiso', coordinates: [28.029570, -26.191123] },
    { id: 'wcco', name: 'WCCO', coordinates: [28.030786, -26.188163] },
    { id: 'dj-du-plessis', name: 'DJ du Plessis', coordinates: [28.024073, -26.188209] },
    { id: 'john-moffat', name: 'John Moffat', coordinates: [28.029308, -26.190220] },
    { id: 'william-library', name: 'William Cullen Library', coordinates: [28.029362, -26.190694] },
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
    { id: 'kambule-building', name: 'TW Kambule MSB', coordinates: [28.026542, -26.190125] },
    { id: 'barnato-residence', name: 'Barnato Residence', coordinates: [28.025023, -26.1869235] },
    { id: 'david-webster', name: 'David Webster Residence', coordinates: [28.025968, -26.186825] },
    { id: 'west-village', name: 'West Campus Village', coordinates: [28.023995, -26.187372] },
    { id: 'convocation-dh', name: 'Convocation DH', coordinates: [28.024077, -26.186835] },
    { id: 'main-dh', name: 'Main DH', coordinates: [28.030731, -26.189531] },
    { id: 'flower-hall', name: 'Flower Hall', coordinates: [28.026051, -26.191734] },
    { id: 'tower-building', name: 'Tower Building', coordinates: [28.025879, -26.189633] },
    { id: 'fnb-building', name: 'FNB Building', coordinates: [28.026673, -26.188551] },
    { id: 'new-commerce-building', name: 'NCB', coordinates: [28.026597, -26.189738] },
    { id: 'msl', name: 'MSL', coordinates: [28.026814, -26.190504] },
    { id: 'physics-labs', name: 'Physics Labs', coordinates: [28.025928, -26.190838] },
    { id: 'physics-building', name: 'Physics Building', coordinates: [28.031225, -26.191683] },
    { id: 'science-stadium', name: 'Science Stadium', coordinates: [28.025167, -26.190533] },
    { id: 'hall-29', name: 'Hall 29', coordinates: [28.025988, -26.186331] },
    { id: 'gym-courts', name: 'Gym and Squash Courts', coordinates: [28.026890, -26.186250] },
    { id: "jimmys", name: "Jimmy's", coordinates: [28.025950, -26.188774] },
    { id: "pimd", name: "PIMD", coordinates: [28.024261, -26.188963] },
    { id: "richard", name: "Richard Ward", coordinates: [28.029595, -26.192958] },
    { id: "evolution", name: "Evolution Studies Institute", coordinates: [28.029019, -26.193095] },
    { id: "chamber", name: "Chamber of Mines", coordinates: [28.026775, -26.191645] },
    { id: "genmin-lab", name: "Genmin Lab", coordinates: [28.025928, -26.191311] },
    { id: "umthonjeni", name: "Umthonjeni", coordinates: [28.031972, -26.190942] },
    { id: "high-voltage-lab", name: "High Voltage Lab", coordinates: [28.025696, -26.191584] },
    { id: 'wits-postgrad-club', name: 'Wits Postgraduates Club', coordinates: [28.028741, -26.192436] },
    { id: 'wits-law-clinic', name: 'Wits Law Clinic', coordinates: [28.025277, -26.189251] },
    { id: 'commerce-library', name: 'Commerce Library', coordinates: [28.025627, -26.189442] },
    { id: 'ccdu', name: 'CCDU', coordinates: [28.026995, -26.190858] },
];

// Known pathways and walkable areas
const PATHWAYS = [
    // Main walkways
    { name: "Main East Walkway", coordinates: [
        [28.0305, -26.1935], [28.0305, -26.1920], [28.0305, -26.1900], [28.0305, -26.1885]
    ]},
    { name: "Library Walkway", coordinates: [
        [28.0295, -26.1910], [28.0305, -26.1910], [28.0315, -26.1910]
    ]},
    { name: "Great Walk", coordinates: [
        [28.032219, -26.191168], [28.031636, -26.191396], [28.031124, -26.191301], [28.030304, -26.191678], 
        [28.029561, -26.191474], [28.029005, -26.191759], [28.027344, -26.191560], [28.027298, -26.191115]
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

// Calculate distance between two points (Haversine formula)
function calculateDistance(lng1, lat1, lng2, lat2) {
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

// Find the closest point on a line segment to a point
function closestPointOnSegment(point, segmentStart, segmentEnd) {
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

// Find the nearest point on any pathway to the given coordinates
function findNearestPathwayPoint(coordinates, pathways = PATHWAYS) {
    let nearestPoint = null;
    let minDistance = Infinity;
    
    // Check all pathway segments
    for (const pathway of pathways) {
        for (let i = 0; i < pathway.coordinates.length - 1; i++) {
            const segmentStart = pathway.coordinates[i];
            const segmentEnd = pathway.coordinates[i + 1];
            
            // Find closest point on this segment
            const closest = closestPointOnSegment(
                coordinates,
                segmentStart,
                segmentEnd
            );
            
            // Calculate distance
            const distance = calculateDistance(
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

// Find the pathway closest to a point
function findClosestPathway(point, pathways = PATHWAYS) {
    let closestPathway = null;
    let minDistance = Infinity;
    
    for (const pathway of pathways) {
        for (const coord of pathway.coordinates) {
            const distance = calculateDistance(
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

// Calculate intersection point of two line segments
function lineIntersection(p1, p2, p3, p4) {
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

// Find intersection point between two pathways (if any)
function findPathwayIntersection(pathway1, pathway2) {
    // Check all segments of pathway1 against all segments of pathway2
    for (let i = 0; i < pathway1.coordinates.length - 1; i++) {
        const p1 = pathway1.coordinates[i];
        const p2 = pathway1.coordinates[i + 1];
        
        for (let j = 0; j < pathway2.coordinates.length - 1; j++) {
            const p3 = pathway2.coordinates[j];
            const p4 = pathway2.coordinates[j + 1];
            
            const intersection = lineIntersection(p1, p2, p3, p4);
            if (intersection) return intersection;
        }
    }
    
    return null;
}

// Find a path through the pathway network (simplified)
function findPathThroughPathways(start, end, pathways = PATHWAYS) {
    // This is a simplified pathfinding implementation
    // In a real application, you would use a proper graph search algorithm
    
    // Find the pathways closest to start and end
    const startPathway = findClosestPathway(start, pathways);
    const endPathway = findClosestPathway(end, pathways);
    
    if (!startPathway || !endPathway) return [];
    
    // If both points are on the same pathway, just connect them directly
    if (startPathway === endPathway) {
        return [start, end];
    }
    
    // Otherwise find a connection between pathways
    // This is a simplified version - in reality you'd need a proper graph of connections
    // Here we just find the intersection point between two pathways if they cross
    
    // Find intersection between pathways
    const intersection = findPathwayIntersection(startPathway, endPathway);
    
    if (intersection) {
        return [start, intersection, end];
    }
    
    // Fallback - connect via campus center if no intersection found
    return [start, CAMPUS_CENTER, end];
}

// Calculate total distance of a route
function calculateRouteDistance(routeCoordinates) {
    let totalDistance = 0;
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
        totalDistance += calculateDistance(
            routeCoordinates[i][0], routeCoordinates[i][1],
            routeCoordinates[i + 1][0], routeCoordinates[i + 1][1]
        );
    }
    return totalDistance;
}

// Validate coordinates
function isValidCoordinate(coordinate) {
    if (!Array.isArray(coordinate) || coordinate.length !== 2) {
        return false;
    }
    
    const [lng, lat] = coordinate;
    return typeof lng === 'number' && typeof lat === 'number' &&
           lng >= -180 && lng <= 180 &&
           lat >= -90 && lat <= 90;
}

// Validate venue object
function isValidVenue(venue) {
    return venue && 
           typeof venue.id === 'string' &&
           typeof venue.name === 'string' &&
           isValidCoordinate(venue.coordinates);
}

// Find venue by ID
function findVenueById(venueId, venues = CAMPUS_VENUES) {
    return venues.find(venue => venue.id === venueId);
}

// Find venue by name (case insensitive)
function findVenueByName(venueName, venues = CAMPUS_VENUES) {
    const searchName = venueName.toLowerCase();
    return venues.find(venue => venue.name.toLowerCase().includes(searchName));
}

// Get all venues in a specific area (bounding box)
function getVenuesInBoundingBox(sw, ne, venues = CAMPUS_VENUES) {
    return venues.filter(venue => {
        const [lng, lat] = venue.coordinates;
        return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
    });
}

// Sort venues by distance from a point
function sortVenuesByDistance(point, venues = CAMPUS_VENUES) {
    return [...venues].sort((a, b) => {
        const distA = calculateDistance(point[0], point[1], a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistance(point[0], point[1], b.coordinates[0], b.coordinates[1]);
        return distA - distB;
    });
}

// Generate GeoJSON feature for a route
function createRouteGeoJSON(coordinates) {
    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        }
    };
}

// Generate GeoJSON feature collection for pathways
function createPathwaysGeoJSON(pathways = PATHWAYS) {
    return {
        type: 'FeatureCollection',
        features: pathways.map(pathway => ({
            type: 'Feature',
            properties: {
                name: pathway.name
            },
            geometry: {
                type: 'LineString',
                coordinates: pathway.coordinates
            }
        }))
    };
}

// Generate GeoJSON feature collection for venues
function createVenuesGeoJSON(venues = CAMPUS_VENUES) {
    return {
        type: 'FeatureCollection',
        features: venues.map(venue => ({
            type: 'Feature',
            properties: {
                id: venue.id,
                name: venue.name
            },
            geometry: {
                type: 'Point',
                coordinates: venue.coordinates
            }
        }))
    };
}

module.exports = {
    MAPBOX_ACCESS_TOKEN,
    CAMPUS_CENTER,
    CAMPUS_VENUES,
    PATHWAYS,
    calculateDistance,
    closestPointOnSegment,
    findNearestPathwayPoint,
    findClosestPathway,
    lineIntersection,
    findPathwayIntersection,
    findPathThroughPathways,
    calculateRouteDistance,
    isValidCoordinate,
    isValidVenue,
    findVenueById,
    findVenueByName,
    getVenuesInBoundingBox,
    sortVenuesByDistance,
    createRouteGeoJSON,
    createPathwaysGeoJSON,
    createVenuesGeoJSON
};