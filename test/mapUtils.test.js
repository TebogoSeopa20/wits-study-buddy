// mapUtils.test.js - Tests for map utility functions
const {
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
} = require('../src/frontend/test_utils/mapUtils');

describe('Map Utility Functions', () => {
    describe('Constants', () => {
        test('CAMPUS_CENTER is defined correctly', () => {
            expect(CAMPUS_CENTER).toEqual([28.0305, -26.1929]);
            expect(isValidCoordinate(CAMPUS_CENTER)).toBe(true);
        });

        test('CAMPUS_VENUES contains valid venues', () => {
            expect(Array.isArray(CAMPUS_VENUES)).toBe(true);
            expect(CAMPUS_VENUES.length).toBeGreaterThan(0);
            CAMPUS_VENUES.forEach(venue => {
                expect(isValidVenue(venue)).toBe(true);
            });
        });

        test('PATHWAYS contains valid pathways', () => {
            expect(Array.isArray(PATHWAYS)).toBe(true);
            expect(PATHWAYS.length).toBeGreaterThan(0);
            PATHWAYS.forEach(pathway => {
                expect(pathway).toHaveProperty('name');
                expect(pathway).toHaveProperty('coordinates');
                expect(Array.isArray(pathway.coordinates)).toBe(true);
                pathway.coordinates.forEach(coord => {
                    expect(isValidCoordinate(coord)).toBe(true);
                });
            });
        });
    });

    describe('calculateDistance', () => {
        test('calculates distance between two points correctly', () => {
            // Test with known coordinates (Great Hall to Wartenweiler Library)
            const greatHall = [28.030374, -26.191809];
            const library = [28.030784, -26.191099];
            
            const distance = calculateDistance(
                greatHall[0], greatHall[1],
                library[0], library[1]
            );
            
            // Should be approximately 80 meters
            expect(distance).toBeGreaterThan(70);
            expect(distance).toBeLessThan(90);
        });

        test('returns 0 for identical points', () => {
            const point = [28.0305, -26.1929];
            const distance = calculateDistance(
                point[0], point[1],
                point[0], point[1]
            );
            
            expect(distance).toBe(0);
        });

        test('handles negative coordinates', () => {
            const distance = calculateDistance(
                -28.0305, -26.1929,
                -28.0306, -26.1930
            );
            
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe('closestPointOnSegment', () => {
        const segmentStart = [28.0305, -26.1929];
        const segmentEnd = [28.0310, -26.1929];
        const point = [28.0307, -26.1930];

        test('finds closest point on segment', () => {
            const closest = closestPointOnSegment(point, segmentStart, segmentEnd);
            
            expect(closest[0]).toBeCloseTo(28.0307);
            expect(closest[1]).toBeCloseTo(-26.1929); // Should be on the line
        });

        test('returns segment start when point is before segment', () => {
            const pointBefore = [28.0300, -26.1929];
            const closest = closestPointOnSegment(pointBefore, segmentStart, segmentEnd);
            
            expect(closest).toEqual(segmentStart);
        });

        test('returns segment end when point is after segment', () => {
            const pointAfter = [28.0315, -26.1929];
            const closest = closestPointOnSegment(pointAfter, segmentStart, segmentEnd);
            
            expect(closest).toEqual(segmentEnd);
        });

        test('handles vertical segments', () => {
            const verticalStart = [28.0305, -26.1929];
            const verticalEnd = [28.0305, -26.1935];
            const point = [28.0306, -26.1930];
            
            const closest = closestPointOnSegment(point, verticalStart, verticalEnd);
            
            expect(closest[0]).toBeCloseTo(28.0305);
            expect(closest[1]).toBeCloseTo(-26.1930);
        });
    });

    describe('findNearestPathwayPoint', () => {
        test('finds nearest point on pathways', () => {
            const point = [28.0306, -26.1910]; // Near Library Walkway
            const nearest = findNearestPathwayPoint(point);
            
            expect(Array.isArray(nearest)).toBe(true);
            expect(nearest.length).toBe(2);
            expect(isValidCoordinate(nearest)).toBe(true);
        });

        test('returns original point if no pathways', () => {
            const point = [28.0306, -26.1910];
            const nearest = findNearestPathwayPoint(point, []);
            
            expect(nearest).toEqual(point);
        });
    });

    describe('findClosestPathway', () => {
        test('finds closest pathway to a point', () => {
            const point = [28.0306, -26.1910]; // Near Library Walkway
            const pathway = findClosestPathway(point);
            
            expect(pathway).toBeDefined();
            expect(pathway).toHaveProperty('name');
            expect(pathway).toHaveProperty('coordinates');
        });

        test('returns null if no pathways', () => {
            const point = [28.0306, -26.1910];
            const pathway = findClosestPathway(point, []);
            
            expect(pathway).toBeNull();
        });
    });

    describe('lineIntersection', () => {
        test('finds intersection of two line segments', () => {
            const p1 = [28.0300, -26.1920];
            const p2 = [28.0310, -26.1920];
            const p3 = [28.0305, -26.1925];
            const p4 = [28.0305, -26.1915];
            
            const intersection = lineIntersection(p1, p2, p3, p4);
            
            expect(intersection).toEqual([28.0305, -26.1920]);
        });

        test('returns null for parallel lines', () => {
            const p1 = [28.0300, -26.1920];
            const p2 = [28.0310, -26.1920];
            const p3 = [28.0300, -26.1930];
            const p4 = [28.0310, -26.1930];
            
            const intersection = lineIntersection(p1, p2, p3, p4);
            
            expect(intersection).toBeNull();
        });

        test('returns null for non-intersecting segments', () => {
            const p1 = [28.0300, -26.1920];
            const p2 = [28.0305, -26.1920];
            const p3 = [28.0310, -26.1920];
            const p4 = [28.0315, -26.1920];
            
            const intersection = lineIntersection(p1, p2, p3, p4);
            
            expect(intersection).toBeNull();
        });
    });

    describe('findPathwayIntersection', () => {
        test('finds intersection between pathways', () => {
            // Create two crossing pathways
            const pathway1 = {
                name: 'Test Pathway 1',
                coordinates: [[28.0300, -26.1920], [28.0310, -26.1920]]
            };
            
            const pathway2 = {
                name: 'Test Pathway 2',
                coordinates: [[28.0305, -26.1925], [28.0305, -26.1915]]
            };
            
            const intersection = findPathwayIntersection(pathway1, pathway2);
            
            expect(intersection).toEqual([28.0305, -26.1920]);
        });

        test('returns null for non-intersecting pathways', () => {
            const pathway1 = {
                name: 'Test Pathway 1',
                coordinates: [[28.0300, -26.1920], [28.0305, -26.1920]]
            };
            
            const pathway2 = {
                name: 'Test Pathway 2',
                coordinates: [[28.0310, -26.1920], [28.0315, -26.1920]]
            };
            
            const intersection = findPathwayIntersection(pathway1, pathway2);
            
            expect(intersection).toBeNull();
        });
    });

    describe('findPathThroughPathways', () => {
        test('finds path through pathways', () => {
            const start = [28.0300, -26.1920];
            const end = [28.0310, -26.1920];
            
            const path = findPathThroughPathways(start, end);
            
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThanOrEqual(2);
            path.forEach(coord => {
                expect(isValidCoordinate(coord)).toBe(true);
            });
        });
    });

    describe('calculateRouteDistance', () => {
        test('calculates total route distance', () => {
            const route = [
                [28.0300, -26.1920],
                [28.0305, -26.1920],
                [28.0310, -26.1920]
            ];
            
            const distance = calculateRouteDistance(route);
            
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeCloseTo(calculateDistance(28.0300, -26.1920, 28.0310, -26.1920));
        });

        test('returns 0 for single-point route', () => {
            const route = [[28.0300, -26.1920]];
            const distance = calculateRouteDistance(route);
            
            expect(distance).toBe(0);
        });
    });

    describe('Validation functions', () => {
        test('isValidCoordinate validates coordinates correctly', () => {
            expect(isValidCoordinate([28.0305, -26.1929])).toBe(true);
            expect(isValidCoordinate([-180, -90])).toBe(true);
            expect(isValidCoordinate([180, 90])).toBe(true);
            expect(isValidCoordinate([181, 91])).toBe(false);
            expect(isValidCoordinate([28.0305])).toBe(false);
            expect(isValidCoordinate('invalid')).toBe(false);
            expect(isValidCoordinate(null)).toBe(false);
        });

    });

    describe('Venue search functions', () => {
        test('findVenueById finds venue by ID', () => {
            const venue = findVenueById('great-hall');
            
            expect(venue).toBeDefined();
            expect(venue.name).toBe('Great Hall');
        });

        test('findVenueByName finds venue by name (case insensitive)', () => {
            const venue = findVenueByName('great hall');
            
            expect(venue).toBeDefined();
            expect(venue.id).toBe('great-hall');
        });

        test('getVenuesInBoundingBox filters venues by area', () => {
            const sw = [28.0290, -26.1930];
            const ne = [28.0310, -26.1910];
            
            const venuesInBox = getVenuesInBoundingBox(sw, ne);
            
            expect(Array.isArray(venuesInBox)).toBe(true);
            venuesInBox.forEach(venue => {
                const [lng, lat] = venue.coordinates;
                expect(lng).toBeGreaterThanOrEqual(sw[0]);
                expect(lng).toBeLessThanOrEqual(ne[0]);
                expect(lat).toBeGreaterThanOrEqual(sw[1]);
                expect(lat).toBeLessThanOrEqual(ne[1]);
            });
        });

        test('sortVenuesByDistance sorts venues correctly', () => {
            const point = CAMPUS_CENTER;
            const sortedVenues = sortVenuesByDistance(point);
            
            expect(sortedVenues.length).toBe(CAMPUS_VENUES.length);
            
            // Check that distances are in ascending order
            for (let i = 0; i < sortedVenues.length - 1; i++) {
                const dist1 = calculateDistance(
                    point[0], point[1],
                    sortedVenues[i].coordinates[0], sortedVenues[i].coordinates[1]
                );
                const dist2 = calculateDistance(
                    point[0], point[1],
                    sortedVenues[i + 1].coordinates[0], sortedVenues[i + 1].coordinates[1]
                );
                expect(dist1).toBeLessThanOrEqual(dist2);
            }
        });
    });

    describe('GeoJSON generation functions', () => {
        test('createRouteGeoJSON creates valid GeoJSON', () => {
            const coordinates = [[28.0300, -26.1920], [28.0310, -26.1920]];
            const geoJSON = createRouteGeoJSON(coordinates);
            
            expect(geoJSON.type).toBe('Feature');
            expect(geoJSON.geometry.type).toBe('LineString');
            expect(geoJSON.geometry.coordinates).toEqual(coordinates);
        });

        test('createPathwaysGeoJSON creates valid GeoJSON', () => {
            const geoJSON = createPathwaysGeoJSON();
            
            expect(geoJSON.type).toBe('FeatureCollection');
            expect(Array.isArray(geoJSON.features)).toBe(true);
            expect(geoJSON.features.length).toBe(PATHWAYS.length);
        });

        test('createVenuesGeoJSON creates valid GeoJSON', () => {
            const geoJSON = createVenuesGeoJSON();
            
            expect(geoJSON.type).toBe('FeatureCollection');
            expect(Array.isArray(geoJSON.features)).toBe(true);
            expect(geoJSON.features.length).toBe(CAMPUS_VENUES.length);
        });
    });
});