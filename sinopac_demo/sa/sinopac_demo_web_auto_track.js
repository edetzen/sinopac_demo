//初始化神策 Web JS SDK
var sensors = window['sensorsDataAnalytic201505'];
sensors.init({
    server_url: 'https://cdp.data-di.com/sa?project=sinopac_poc',
    heatmap: { scroll_notice_map: 'not_collect' },
    is_track_single_page: true,
    use_client_time: true,
    send_type: 'beacon'
});
sensors.quick('autoTrack');

// 初始化 H5 彈窗 SDK 和設定行為
sensors.use('Popup', {
    api_base_url: 'https://sfo.data-di.com/api/v2',
    popup_campaign_listener: {
        shouldStart: function (SFCampaign) {
            // ...
            return true;
        },
        onStart: function (SFCampaign) {
            alert('Popup onStart!');
            document.getElementById('popup_div').innerHTML = '<samp>' + SFCampaign.content + '</samp>';
        },
        onFailed: function (SFCampaign, errorCode, errorMessage) {
            alert('Popup onFailed!');
        },
        onEnd: function (SFCampaign) {
            alert('Popup onEnd!');
        }
    },
    popup_listener: {
        openlink: 'auto'
    }
});

// 初始化 Web 彈窗 SDK 和設定行為
sensors.use('WebPopup', {
    api_base_url: 'https://sfo.data-di.com/api/v2',
    popup_campaign_listener: {
        shouldStart: function (SFCampaign) {
            // ...
            return true;
        },
        onStart: function (SFCampaign) {
            alert('webPopup onStart!');
            document.getElementById('popup_div').innerHTML = '<samp>' + SFCampaign.content + '</samp>';
            let dataset = JSON.parse(SFCampaign.content);
            let popup_title = dataset[0].value;
            let popup_body = dataset[1].value;
            let popup_link = dataset[2].value;
            let popup_date = dataset[3].value;
            let popup_number = dataset[4].value;
            let popup_img1 = dataset[5].value;
            let popup_img2 = dataset[6].value;
            let popup_img3 = dataset[7].value;
            document.getElementById('exampleModalLabel').innerHTML = 'Title：' + popup_title;
            document.getElementById('modal-body').innerHTML = 'Body：' + popup_body + '<br />Date：' + popup_date + '<br />Number：' + popup_number + '<br />Image 01：<br /><img src="' + popup_img1 + '" width="100%"><br />Image 02：<br /><img src="' + popup_img2 + '" width="100%"><br />Image 03：<br /><img src="' + popup_img3 + '" width="100%"><br /><a href="' + popup_link + '">LINK</a>';

        },
        onFailed: function (SFCampaign, errorCode, errorMessage) {
            alert('webPopup onFailed!');
        },
        onEnd: function (SFCampaign) {
            alert('webPopup onEnd!');
        }
    }
});
