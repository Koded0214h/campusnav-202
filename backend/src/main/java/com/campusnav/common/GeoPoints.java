package com.campusnav.common;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

public final class GeoPoints {

    private static final int WGS_84_SRID = 4326;
    private static final GeometryFactory FACTORY =
            new GeometryFactory(new PrecisionModel(), WGS_84_SRID);

    private GeoPoints() {
    }

    public static Point from(double latitude, double longitude) {
        Point point = FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(WGS_84_SRID);
        return point;
    }
}
