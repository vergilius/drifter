/**
 * Created by vergilius on 22/04/14.
 */

var Engine;

(function( Engine ) {

    var Camera = (function() {

        function Camera() {
            this.position = BABYLON.Vector3.Zero();
            this.target = BABYLON.Vector3.Zero();
        }

        return Camera;
    } ());

    Engine.Camera = Camera;

    var Mesh = (function() {

        function Mesh( name, verticesCount ) {
            this.name = name;
            this.vertices = new Array( verticesCount );
            this.rotation = BABYLON.Vector3.Zero();
            this.position = BABYLON.Vector3.Zero();
        }

        return Mesh;
    } ());

    Engine.Mesh = Mesh;
} ( Engine || ( Engine = {} ) ));