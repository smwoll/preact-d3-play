import * as d3 from "d3";
import * as d3GeoProjection from "d3-geo-projection";
import * as topojson from 'topojson-client';

import { useRef, useState } from "preact/hooks";

// Import the GeoJSON data.
import geoData from "../geoData/countries-110m.json";

const countryShapes = topojson.feature(geoData, geoData.objects.countries);

import useChartDimensions from "../hooks/useChartDimensions";

const defaultTransform = d3.zoomIdentity;

const Country = ({ shape, pathGenerator, zoom, d3Svg, size }) => {
    return (
        <path
            key={shape.properties.subunit}
            d={pathGenerator(shape)}
            fill="#9980FA"
            stroke="#fff"
            onClick={() => {

                const [[x0, y0], [x1, y1]] = pathGenerator.bounds(shape);
                const width = x1 - x0;
                const height = y1 - y0;
                const x = (x0 + x1) / 2;
                const y = (y0 + y1) / 2;
                const scale = Math.min(8, 0.9 / Math.max(width / 960, height / 500));
                const translate = [960 / 2 - scale * x, 500 / 2 - scale * y];

                console.log(x0, y0, x1, y1, width, height, x, y, scale, translate);

                d3Svg.transition()
                    .duration(750)
                    .call(
                        zoom.transform,
                        d3.zoomIdentity
					.translate(size.width / 2 - 100, size.height / 2)
					.scale(2)
					.translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    );

            }}
        >
            <title>
                {shape.properties.name}
            </title>
        </path>
    )
};

const WorldMap = ({ projectionName = "geoNaturalEarth2" }) => {
    // grab our custom React hook we defined above
    const [ref, dms] = useChartDimensions({})

    const svgRef = useRef();

    console.log(svgRef);

    // this is the definition for the whole Earth
    const sphere = { type: "Sphere" }

    const projectionFunction = d3[projectionName]
        || d3GeoProjection[projectionName]
    const projection = projectionFunction()
        .fitWidth(dms.width, sphere)
    const pathGenerator = d3.geoPath(projection)

    const d3Svg = d3.select(svgRef.current);

    // size the svg to fit the height of the map
    const [
        [x0, y0],
        [x1, y1]
    ] = pathGenerator.bounds(sphere)
    const height = y1

    const [transform, setTransform] = useState(defaultTransform);

    const zoom = d3.zoom().scaleExtent([1, 20]).on("zoom", (e) => {
        console.log('zooming', e.transform);
        setTransform(e.transform);
    });

    d3Svg.call(zoom);

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
            }}
        >
            <svg width={dms.width} height={height} ref={svgRef} viewBox={`0 0 ${dms.width} ${height}`}>
                <defs>
                    {/* some projections bleed outside the edges of the Earth's sphere */}
                    {/* let's create a clip path to keep things in bounds */}
                    <clipPath id="Map__sphere">
                        <path d={pathGenerator(sphere)} />
                    </clipPath>
                </defs>

                <g transform={ transform }>
                    {/* The sphere bg. */}
                    <path
                        d={pathGenerator(sphere)}
                        fill="#f2f2f7"
                    />

                    <g style={{ clipPath: "url(#Map__sphere)" }}>
                        {countryShapes.features.map((shape) => (
                            <Country
                                key={shape.id}
                                shape={shape}
                                pathGenerator={pathGenerator}
                                zoom={zoom}
                                d3Svg={d3Svg}
                                size={{ width: dms.width, height }}
                            />
                        ))}
                    </g>
                </g>
            </svg>
        </div>
    )
}

export default WorldMap;