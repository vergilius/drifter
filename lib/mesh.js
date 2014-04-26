/**
 * Created by vergilius on 26/04/14.
 */

var Engine;

(function( Engine ) {

    var Mesh = (function() {

        function Mesh( name, verticesCount, facesCount ) {
            this.name = name;
            this.vertices = new Array( verticesCount );
            this.faces = new Array( facesCount );
            this.rotation = BABYLON.Vector3.Zero();
            this.position = BABYLON.Vector3.Zero();
        }

        return Mesh;
    } ());

    Engine.Mesh = Mesh;

} ( Engine || ( Engine = {} ) ));