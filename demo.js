/**
 * Created by vergilius on 23/04/14.
 */

var canvas,
    renderer,
    mesh,
    meshes = [],
    camera,
    Demo;

var left = true;

Demo = {
    initialize : function() {

        canvas = document.getElementById('display');
        mesh = new Engine.Mesh('box', 8, 12);
//        meshes.push( mesh );
        camera = new Engine.Camera();

        renderer = new Engine.Renderers.SoftwareRenderer( canvas );

        // cube
//
        mesh.vertices[0] = new BABYLON.Vector3(-1, 1, 1);
        mesh.vertices[1] = new BABYLON.Vector3(1, 1, 1);
        mesh.vertices[2] = new BABYLON.Vector3(-1, -1, 1);
        mesh.vertices[3] = new BABYLON.Vector3(1, -1, 1);
        mesh.vertices[4] = new BABYLON.Vector3(-1, 1, -1);
        mesh.vertices[5] = new BABYLON.Vector3(1, 1, -1);
        mesh.vertices[6] = new BABYLON.Vector3(1, -1, -1);
        mesh.vertices[7] = new BABYLON.Vector3(-1, -1, -1);

        mesh.faces[0] = { A:0, B:1, C:2 };
        mesh.faces[1] = { A:1, B:2, C:3 };
        mesh.faces[2] = { A:1, B:3, C:6 };
        mesh.faces[3] = { A:1, B:5, C:6 };
        mesh.faces[4] = { A:0, B:1, C:4 };
        mesh.faces[5] = { A:1, B:4, C:5 };

        mesh.faces[6] = { A:2, B:3, C:7 };
        mesh.faces[7] = { A:3, B:6, C:7 };
        mesh.faces[8] = { A:0, B:2, C:7 };
        mesh.faces[9] = { A:0, B:4, C:7 };
        mesh.faces[10] = { A:4, B:5, C:6 };
        mesh.faces[11] = { A:4, B:6, C:7 };

       camera.position = new BABYLON.Vector3( 0, 0, 10 );
       camera.target = new BABYLON.Vector3( 0, 0, 0 );

        Demo.loadScene( renderer );
    },
    loadScene: function( renderer ) {

        renderer.loadJSONAsync('monkey.babylon', function( loaded ) {
            var newMeshes = renderer.createMeshFromJSON( loaded );

           newMeshes[0].rotation.y = 96 * (180 / Math.PI);
           // newMeshes[0].rotation.y = -1.55;
           // newMeshes[0].rotation.z = 3;
            meshes = meshes.concat(newMeshes);
            console.error( newMeshes, loaded );
            requestAnimationFrame( Demo.draw );
        });
    },
    draw : function () {

        renderer.clear();
        var speed = 0.005;
        meshes.forEach(function( mesh ) {
//            if( mesh.rotation.x >= 0.3 ) {
//                left = false;
//            } else if( mesh.rotation.x <= -0.3 ) {
//                left = true;
//            }

//            if( left ) {
               // mesh.rotation.x += speed;
               // mesh.rotation.y += speed;
//                mesh.rotation.z += speed;
//            } else {
//                mesh.rotation.x -= speed;
//                mesh.rotation.y -= speed;
//                mesh.rotation.z -= speed;
//            }


        });

        renderer.render( camera, meshes );
        renderer.flush();

        requestAnimationFrame( Demo.draw );
    }
};

document.addEventListener('DOMContentLoaded', Demo.initialize, false);