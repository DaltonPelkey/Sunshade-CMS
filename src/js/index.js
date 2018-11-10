import Inputmask from 'inputmask';
import $ from 'jquery';
import { ipcRenderer } from 'electron';
import moment from 'moment';

$(document).ready(() => {
    ipcRenderer.on('error', (event, err) => {
        alert(JSON.stringify(err));
    });
    ipcRenderer.on('all-clients-response', (event, clients) => {
        loadClientCards(clients);
    });
    ipcRenderer.on('fetch-client-response', (event, client) => {
        resetClientModal(client);
    });

    // Load client cards on init
    ipcRenderer.send('fetch-all-clients');

    // Initialize dropdowns
    $('.ui.dropdown').dropdown();

    // Show modal when card is clicked
    $(document).on('click', '.client.card', function () {
        ipcRenderer.send('fetch-client', $(this).attr('data-client-id'));
        $('#view_client_modal').modal({
            blurring: true,
            allowMultiple: true
        }).modal('show');
    });
    $(document).on('click', '#new_client_btn', () => {
        resetClientModal();
        $('#view_client_modal').modal({
            blurring: true,
            allowMultiple: true
        }).modal('show');
    });
    $(document).on('click', '#delete_client_btn', () => {
        resetPrompt('question', 'Delete this client?', 'This action can not be undone!');
        $('#prompt')
            .modal({
                closable: false,
                onDeny: function () {
                    $('#prompt').modal('hide', () => {
                        $('#view_client_modal').modal('show');
                    });
                },
                onApprove: function () {
                    console.log('delete');
                }
            })
            .modal('show');
    });

    // Handle save client button press
    $('#save_client_btn').on('click', () => {
        const client = {
            fname: $('input[name="fname"]').val().trim(),
            lname: $('input[name="lname"]').val().trim(),
            phone: $('input[name="phone"]').val().trim(),
            address: $('input[name="address"]').val().trim(),
            apt: $('input[name="apt"]').val().trim(),
            state: $('select[name="state"]').val().trim(),
            country: $('input[name="country"]').val().trim()
        };
        ipcRenderer.send('update-client', client);
    });

    // Initialize input masks
    Inputmask().mask($('.input_mask'));

    // Handle upload button press
    // $('#upload_button').on('click', () => {
    //     ipcRenderer.send('create-open-dialog');
    // });

    // Handle drag-drop upload
    // $('#dragdrop').on('dragover', (event) => {
    //     event.preventDefault();
    //     event.stopPropagation();
    // });

    // $('#dragdrop').on('dragleave', (event) => {
    //     event.preventDefault();
    //     event.stopPropagation();
    // });

    // $('#dragdrop').on('drop', (e) => {
    //     if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         console.log(e.originalEvent.dataTransfer.files);
    //     }
    // });
});

const resetClientModal = client => {
    if (!client) {
        $('#client_modal_header').html("New Client");
        $('input').val('');
        $('#view_client_modal').attr('data-client-id', '');
    } else {
        $('#view_client_modal').attr('data-client-id', client._id);
        $('#client_modal_header').html(`${client.first_name} ${client.last_name} <span class="small_text">ID: ${client._id}</span>`);
        $('input[name="fname"]').val(client.first_name);
        $('input[name="lname"]').val(client.last_name);
        $('input[name="phone"]').val(client.phone_number);
        $('input[name="address"]').val(client.street_address);
        $('input[name="apt"]').val(client.appartment_number);
        $('input[name="country"]').val(client.country);
        $('select[name="state"] option[value="' + client.state + '"]').attr('selected', 'select');
    }
}

const resetPrompt = (icon, title, desc) => {
    const p = $('#prompt');
    p.find('.header').html(`<i class="${icon} icon"></i> ${title}`);
    p.find('.content p').html(desc);
};

const loadClientCards = clients => {
    const clientContainer = $('#client_container');
    clientContainer.fadeOut(200).html('');
    clients.forEach(client => {
        client = client.doc;
        clientContainer.append(`
            <a class="ui client card" href="javascript:void(0)" data-client-id="${client._id}">
                <div class="content">
                    <div class="header">${client.first_name} ${client.last_name}</div>
                    <div class="meta">
                        <span class="category">${client.phone_number}</span>
                    </div>
                    <div class="meta">
                        <span class="category">${client.street_address}</span>
                    </div>
                </div>
                <div class="extra content">
                    <i class="calendar check outline icon"></i>
                    Added on ${moment(client.date_created).format('MMM Do, YYYY')}
                </div>
            </a>
        `);
    });
    clientContainer.fadeIn(200);
};
