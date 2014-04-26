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
            var distance = pointB.subtract(pointA).length(),
                middlePoint;

            if ( distance < 2 ) {
                return;
            }

            middlePoint = pointA.add( (pointB.subtract( pointA )).scale(0.5) );

            this.drawPoint( middlePoint );

            this.drawLine( pointA, middlePoint );
            this.drawLine( middlePoint, pointB );
        };

        SoftwareRenderer.prototype.render = function( camera, meshes ) {

            var viewMatrix = BABYLON.Matrix.LookAtLH( camera.position, camera.target, BABYLON.Vector3.Up()),
                projectionMatrix = BABYLON.Matrix.PerspectiveFovLH( 0.8, this.bufferWidth / this.bufferHeight, 0.01, 1.0),
                index, indexVertices;

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

                // iterate trough mesh vertices
                for( indexVertices = 0; indexVertices < currentMesh.vertices.length; indexVertices++ ) {
                    var projectedPoint = this.project( currentMesh.vertices[ indexVertices ], transformMatrix );
                    this.drawPoint( projectedPoint );
                }
            }
        };

        return SoftwareRenderer;
    } ());

    Engine.Renderers = Engine.Renderers || {};
    Engine.Renderers.SoftwareRenderer = SoftwareRenderer;

} ( Engine || ( Engine = {} )));