/**
 * Created by vergilius on 23/04/14.
 */

var canvas,
    renderer,
    mesh,
    meshes = [],
    camera,
    Demo;

Demo = {
    initialize : function() {

        canvas = document.getElementById('display');
        mesh = new Engine.Mesh('box', 8);
        meshes.push( mesh );
        camera = new Engine.Camera();
        renderer = new Engine.Renderers.SoftwareRenderer( canvas );

        mesh.vertices[ 0 ] = new BABYLON.Vector3( -1, 1, 1 );
        mesh.vertices[ 1 ] = new BABYLON.Vector3( 1, 1, 1 );
        mesh.vertices[ 2 ] = new BABYLON.Vector3( -1, -1, 1 );
        mesh.vertices[ 3 ] = new BABYLON.Vector3( -1, -1, -1 );
        mesh.vertices[ 4 ] = new BABYLON.Vector3( -1, 1, -1 );
        mesh.vertices[ 5 ] = new BABYLON.Vector3( 1, 1, -1 );
        mesh.vertices[ 6 ] = new BABYLON.Vector3( 1, -1, 1 );
        mesh.vertices[ 7 ] = new BABYLON.Vector3( 1, -1, -1 );


        camera.position = new BABYLON.Vector3( 0, 0, 10 );
        camera.target = new BABYLON.Vector3( 0, 0, 0 );


        requestAnimationFrame( Demo.draw );
    },
    draw : function () {

        renderer.clear();

        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;

        renderer.render( camera, meshes );
        renderer.flush();

        requestAnimationFrame( Demo.draw );
    }
};

document.addEventListener('DOMContentLoaded', Demo.initialize, false);