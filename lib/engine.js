/**
 * Created by vergilius on 22/04/14.
 */

var Engine;

(function( Engine ) {

    var Camera = (function() {

        function Camera() {
            this.position = new BABYLON.Vector3(0, 50, 10);
            this.target = new BABYLON.Vector3(0, 0, 0);
        }

        return Camera;
    } ());

    Engine.Camera = Camera;

} ( Engine || ( Engine = {} ) ));