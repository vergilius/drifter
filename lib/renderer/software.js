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
        }

        // fill backbuffer and clear context
        SoftwareRenderer.prototype.clear = function() {
            this.bufferContext.clearRect( 0, 0, this.bufferWidth, this.bufferHeight );
            this.backbuffer = this.bufferContext.getImageData( 0, 0, this.bufferWidth, this.bufferHeight );
        };

        // fill buffer context
        SoftwareRenderer.prototype.flush = function() {
            this.bufferContext.putImageData( this.backbuffer, 0, 0 );
        };

        // put pixel onto buffer
        SoftwareRenderer.prototype.putPixel = function( x, y, color ) {
            this.backbufferData = this.backbuffer.data;

            var index = ( ( x >> 0) + ( y >> 0 ) * this.bufferWidth ) * 4;

            this.backbufferData[ index ] = color.r * 255;
            this.backbufferData[ index + 1 ] = color.g * 255;
            this.backbufferData[ index + 2 ] = color.b * 255;
            this.backbufferData[ index + 3 ] = color.a * 255;
        };

        // project 3d coords to 2d
        SoftwareRenderer.prototype.project = function( coords, transformationMartix ) {
            var point = BABYLON.Vector3.TransformCoordinates( coords, transformationMartix),
                x = point.x * this.bufferWidth + this.bufferWidth / 2 >> 0,
                y = point.y * this.bufferHeight + this.bufferHeight / 2 >> 0;

            return ( new BABYLON.Vector2( x, y ) );
        };

        SoftwareRenderer.prototype.drawPoint = function( point ) {

            // clipping
            if ( point.x >= 0 && point.y >= 0
                && point.x <= this.bufferWidth
                && point.y <= this.bufferHeight ) {

                this.putPixel( point.x, point.y, new BABYLON.Color4( 0, 0, 0, 1) );
            }
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
                this.drawPoint( new BABYLON.Vector2( x0, y0 ) );

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
                    var x = vertices[ index * verticesStep ] * mesh.scaling.x / 2,
                        y = vertices[ index * verticesStep + 1 ] * mesh.scaling.y / 2,
                        z = vertices[ index * verticesStep + 2 ] * mesh.scaling.z / 2;

                    mesh.vertices[ index ] = new BABYLON.Vector3( x, y, z );
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
                        pixelA = this.project( vertexA, transformMatrix),
                        pixelB = this.project( vertexB, transformMatrix),
                        pixelC = this.project( vertexC, transformMatrix);

                    this.drawLine( pixelA, pixelB );
                    this.drawLine( pixelB, pixelC );
                    this.drawLine( pixelC, pixelA );
                }
            }
        };

        return SoftwareRenderer;
    } ());

    Engine.Renderers = Engine.Renderers || {};
    Engine.Renderers.SoftwareRenderer = SoftwareRenderer;

} ( Engine || ( Engine = {} )));