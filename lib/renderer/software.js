/**
 * Created by vergilius on 22/04/14.
 */
var Engine;

(function( Engine ) {
    var SoftwareRenderer = (function() {

        function SoftwareRenderer( canvas ) {
            this.bufferCanvas = canvas;
            this.bufferWidth = canvas.width;
            this.bufferHeight = canvas.height;
            this.bufferContext = canvas.getContext('2d');

            this.depthBuffer = new Array( this.bufferWidth * this.bufferHeight );
        }

        // fill backbuffer and clear context
        SoftwareRenderer.prototype.clear = function() {
            this.bufferContext.clearRect( 0, 0, this.bufferWidth, this.bufferHeight );
            this.backbuffer = this.bufferContext.getImageData( 0, 0, this.bufferWidth, this.bufferHeight );

            for( var i = 0; i < this.depthBuffer.length; i++ ) {
                this.depthBuffer[i] = 10000000;
            }
        };

        // fill buffer context
        SoftwareRenderer.prototype.flush = function() {
            this.bufferContext.putImageData( this.backbuffer, 0, 0 );
        };

        // put pixel onto buffer
        SoftwareRenderer.prototype.putPixel = function( x, y, z, color ) {
            this.backbufferData = this.backbuffer.data;

            var index0 = ( ( x >> 0) + ( y >> 0 ) * this.bufferWidth ),
                index = index0 * 4;

            if ( this.depthBuffer[ index0 ] < z ) {
                return;
            }

            this.backbufferData[ index ] = color.r * 255;
            this.backbufferData[ index + 1 ] = color.g * 255;
            this.backbufferData[ index + 2 ] = color.b * 255;
            this.backbufferData[ index + 3 ] = color.a * 255;
        };

        // project 3d coords to 2d
        SoftwareRenderer.prototype.project = function( vertex, transformationMartix, world ) {
            var point = BABYLON.Vector3.TransformCoordinates( vertex.coordinates, transformationMartix ),
                point3DWorld = BABYLON.Vector3.TransformCoordinates( vertex.coordinates, world ),
                normal3DWorld = BABYLON.Vector3.TransformCoordinates( vertex.normal, world ),
                x = point.x * this.bufferWidth + this.bufferWidth / 2 >> 0,
                y = -point.y * this.bufferHeight + this.bufferHeight / 2 >> 0;

            return ( {
                coordinates : new BABYLON.Vector3( x, y, point.z ),
                normal : normal3DWorld,
                world : point3DWorld
            } );
        };

        SoftwareRenderer.prototype.drawPoint = function( point, color ) {

            if ( !color ) {
                color = new BABYLON.Color4( 0, 0, 0, 1);
            }

            // clipping
            if ( point.x >= 0 && point.y >= 0
                && point.x <= this.bufferWidth
                && point.y <= this.bufferHeight ) {

                this.putPixel( point.x, point.y, point.z, color );
            }
        };

        SoftwareRenderer.prototype.clamp = function( value, min, max ) {
            if ( !min ) {
                min = 0;
            }

            if ( !max ) {
                max = 1;
            }

            return Math.max( min, Math.min( value, max ) );
        };

        SoftwareRenderer.prototype.interpolate = function( min, max, gradient ) {
            return min + ( max - min ) * this.clamp( gradient );
        };

        SoftwareRenderer.prototype.drawTriangle = function( vertexA, vertexB, vertexC, color ) {
            var pointA = vertexA.coordinates,
                pointB = vertexB.coordinates,
                pointC = vertexC.coordinates,
                temporaryVertex,
                inverseSlopeAB,
                inverseSlopeAC;

            if ( pointA.y > pointB.y ) {
                temporaryVertex = vertexB;
                vertexB = vertexA;
                vertexA = temporaryVertex;
            }

            if ( pointB.y > pointC.y ) {
                temporaryVertex = vertexB;
                vertexB = vertexC;
                vertexC = temporaryVertex;
            }

            if ( pointA.y > pointB.y ) {
                temporaryVertex = vertexB;
                vertexB = vertexA;
                vertexA = temporaryVertex;
            }

            var normalizedVector = ( vertexA.normal.add( vertexB.normal.add( vertexC.normal ) ) ).scale( 1 / 3 ),
                centerPoint = ( vertexA.world.add( vertexB.world.add( vertexC.world ) ) ).scale( 1 / 3 ),
                lightPosition = new BABYLON.Vector3( 0, 1110,0),
                normal = this.normalize( centerPoint, normalizedVector, lightPosition),
                data = {
                    pointLight : normal,
                    currentY : null
                };

            if ( pointB.y - pointA.y > 0 ) {
                inverseSlopeAB = ( pointB.x - pointA.x ) / ( pointB.y - pointA.y );
            } else {
                inverseSlopeAB = 0;
            }

            if ( pointC.y - pointA.y > 0 ) {
                inverseSlopeAC = ( pointC.x - pointA.x ) / ( pointC.y - pointA.y );
            } else {
                inverseSlopeAC = 0;
            }


            // "right sided" triangles ( pointB on right )
            if ( inverseSlopeAB > inverseSlopeAC ) {

                for ( var y = pointA.y >> 0; y <= pointC.y >> 0; y++ ) {
                    data.currentY = y;

                    if ( y < pointB.y ) {
                        this.processLine( data, vertexA, vertexC, vertexA, vertexB, color );
                    } else {
                        this.processLine( data, vertexA, vertexC, vertexB, vertexC, color );
                    }
                }
            } else {
                // "left sided" triangles ( pointB on left )
                for ( var y = pointA.y >> 0; y <= pointC.y >> 0; y++ ) {
                    data.currentY = y;

                    if ( y < pointB.y ) {
                        this.processLine( data, vertexA, vertexB, vertexA, vertexC, color );
                    } else {
                        this.processLine( data, vertexB, vertexC, vertexA, vertexC, color );
                    }
                }
            }


        };

        SoftwareRenderer.prototype.processLine = function( data, vertexA, vertexB, vertexC, vertexD, color ) {

            var pointA = vertexA.coordinates,
                pointB = vertexB.coordinates,
                pointC = vertexC.coordinates,
                pointD = vertexD.coordinates,
                gradient1 = pointA.y !== pointB.y ? ( data.currentY - pointA.y ) / ( pointB.y - pointA.y ) : 1,
                gradient2 = pointC.y !== pointD.y ? ( data.currentY - pointC.y ) / ( pointD.y - pointC.y ) : 1,
                startX = this.interpolate( pointA.x, pointB.x, gradient1 ) >> 0,
                endX = this.interpolate( pointC.x, pointD.x, gradient2) >> 0,
                startZ = this.interpolate( pointA.z, pointB.z, gradient1 ) >> 0,
                endZ = this.interpolate( pointC.z, pointD.z, gradient2) >> 0,
                x = startX,
                gradient3, z;

            for ( ; x < endX; x++ ) {
                gradient3 = ( x - startX ) / ( endX - startX );
                z = this.interpolate( startZ, endZ, gradient3 );

                this.drawPoint(
                    new BABYLON.Vector3( x, data.currentY, z ),
                    new BABYLON.Color4( color.r * data.pointLight, color.g * data.pointLight, color.b * data.pointLight, 1 )
                );
            }
        };

        SoftwareRenderer.prototype.normalize = function( vertex, normal, lightPosition ) {
            var lightDirection = lightPosition.subtract( vertex );

            normal.normalize();
            lightDirection.normalize();

            return Math.max( 0, BABYLON.Vector3.Dot( normal, lightDirection ) );
        };

        SoftwareRenderer.prototype.drawLine = function( pointA, pointB ) {
//            var distance = pointB.subtract(pointA).length(),
//                middlePoint;
//
//            if ( distance < 2 ) {
//                return;
//            }
//
//            middlePoint = pointA.add( (pointB.subtract( pointA )).scale(0.5) );
//
//            this.drawPoint( middlePoint );
//
//            this.drawLine( pointA, middlePoint );
//            this.drawLine( middlePoint, pointB );


            // new version - build with Bresenham's alghoritm
            var x0 = pointA.x >> 0,
                y0 = pointA.y >> 0,
                x1 = pointB.x >> 0,
                y1 = pointB.y >> 0,
                distanceX = Math.abs( x1 - x0 ),
                distanceY = Math.abs( y1 - y0),
                nextX = ( x0 < x1 ) ? 1 : -1,
                nextY = ( y0 < y1 ) ? 1 : -1,
                middle = distanceX - distanceY;

            while ( true ) {
                this.drawPoint( new BABYLON.Vector3( x0, y0, 0 ) );

                if ( ( x0 == x1 ) && ( y0 == y1 ) ) {
                    break;
                }

                var middle2 = middle * 2;

                if ( middle2 > -distanceY ) {
                    middle -= distanceY;
                    x0 += nextX;
                }

                if ( middle2 < distanceX ) {
                    middle += distanceX;
                    y0 += nextY;
                }
            };
        };

        SoftwareRenderer.prototype.loadJSONAsync = function( filename, callback ) {
            var xhr = new XMLHttpRequest();

            xhr.open("GET", filename, true);
            xhr.onreadystatechange = function() {
                if ( xhr.readyState === 4 && xhr.status === 200 ) {
                    callback( JSON.parse( xhr.responseText ) );
                }
            };
            xhr.send();
        };

        SoftwareRenderer.prototype.createMeshFromJSON = function( data ) {
            var meshes = [],
                meshIndex = 0;

            for ( ; meshIndex < data.meshes.length; meshIndex++ ) {

                var meshData = data.meshes[ meshIndex ],
                    vertices = meshData.positions,
                    indices = meshData.indices,
                    uvCount = meshData.uvCount,
                    verticesStep = 3,
                    verticesCount,
                    facesCount,
                    mesh,
                    index;

                console.log('json data', meshData);

                switch ( uvCount ) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }


                verticesCount = vertices.length / verticesStep;
                facesCount = indices.length / 3; // triagles
                mesh = new Engine.Mesh( meshData, verticesCount, facesCount );

                mesh.position = new BABYLON.Vector3( meshData.position[0],
                    meshData.position[1], meshData.position[2] );

                mesh.rotation = new BABYLON.Vector3( meshData.rotation[0],
                    meshData.rotation[1], meshData.rotation[2] );

                mesh.scaling = new BABYLON.Vector3( meshData.scaling[0],
                    meshData.scaling[1], meshData.scaling[2] );

                for ( index = 0; index < verticesCount; index++ ) {
                    var x = vertices[ index * verticesStep ] * mesh.scaling.x,
                        y = vertices[ index * verticesStep + 1 ] * mesh.scaling.y,
                        z = vertices[ index * verticesStep + 2 ] * mesh.scaling.z;

                    // normals
                    var nx = vertices[ index * verticesStep + 3 ],
                        ny = vertices[ index * verticesStep + 4 ],
                        nz = vertices[ index * verticesStep + 5 ];

//                    mesh.vertices[ index ] = new BABYLON.Vector3( x, y, z );
                    mesh.vertices[ index ] = {
                        coordinates : new BABYLON.Vector3( x, y, z ),
                        normal : new BABYLON.Vector3( nx, ny, nz ),
                        world : null
                    };
                }

                for ( index = 0; index < facesCount; index ++ ) {
                    var a = indices[ index * 3 ],
                        b = indices[ index * 3 + 1 ],
                        c = indices[ index * 3 + 2 ];

                    mesh.faces[ index ] = {
                        A : a,
                        B : b,
                        C : c
                    };
                }

                meshes.push( mesh );
            }

            return meshes;
        };

        SoftwareRenderer.prototype.render = function( camera, meshes ) {

            var viewMatrix = BABYLON.Matrix.LookAtLH( camera.position, camera.target, BABYLON.Vector3.Up()),
                projectionMatrix = BABYLON.Matrix.PerspectiveFovLH( 0.8, this.bufferWidth / this.bufferHeight, 0.01, 1.0),
                index, indexVertices, indexFaces;

            for( index = 0; index < meshes.length; index++ ) {

                var currentMesh = meshes[ index ],
                    worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                        currentMesh.rotation.x,
                        currentMesh.rotation.y,
                        currentMesh.rotation.z
                    ).multiply(
                        BABYLON.Matrix.Translation(
                            currentMesh.position.x,
                            currentMesh.position.y,
                            currentMesh.position.z
                        )
                    ),
                    // transformMatrix = worldMatrix * viewMatrix * projectionMatrix :3
                    transformMatrix = worldMatrix.multiply( viewMatrix ).multiply( projectionMatrix );

                for ( indexFaces = 0; indexFaces < currentMesh.faces.length; indexFaces++ ) {

                    var currentFace = currentMesh.faces[ indexFaces ],
                        vertexA = currentMesh.vertices[ currentFace.A ],
                        vertexB = currentMesh.vertices[ currentFace.B ],
                        vertexC = currentMesh.vertices[ currentFace.C ],
                        pixelA = this.project( vertexA, transformMatrix, worldMatrix ),
                        pixelB = this.project( vertexB, transformMatrix, worldMatrix ),
                        pixelC = this.project( vertexC, transformMatrix, worldMatrix );

                    var color = 1;

                    this.drawLine( pixelA, pixelB );
                    this.drawLine( pixelB, pixelC );
                    this.drawLine( pixelC, pixelA );

                    this.drawTriangle( pixelA, pixelB, pixelC, new BABYLON.Color4( color, color, color, 1 ) );
                }
            }
        };

        return SoftwareRenderer;
    } ());

    Engine.Renderers = Engine.Renderers || {};
    Engine.Renderers.SoftwareRenderer = SoftwareRenderer;

} ( Engine || ( Engine = {} )));