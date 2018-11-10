import Inputmask from 'inputmask';
import $ from 'jquery';
import { remote } from 'electron';
import fs from 'fs';

$('document').ready(() => {
    // Initialize dropdowns
    $('.ui.dropdown').dropdown();

    // Show modal when card is clicked
    $('.client.card').on('click', () => {
        $('#view_client_modal').modal({
            blurring: true
        }).modal('show');
    });

    // Initialize input masks
    Inputmask().mask($('.input_mask'));

    // Handle upload button press
    $('#upload_button').on('click', () => {
        remote.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }, (files) => {
            if (files && files.length > 0) {
                fs.readFile(files[0], (err, data) => {
                    if (err) return alert('An error occured while reading the uploaded file.');
                    console.log(data);
                });
            }
        });
    });
});
