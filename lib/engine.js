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

} ( Engine || ( Engine = {} ) ));