const list_api_url = 'https://sfo.data-di.com/api/v2/sfo/section/recommend?org_id=data-di-gcp-taiwan&access_token=d5aad9ab-7f0c-448a-a214-40c2aea1e887'

let list_headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "project-name": "sinopac_poc"
}

let list_body = {
    "section_id": "section_id_6332266746692",
    "distinct_id": "100ff36a832edacd",
    "log_id": "WXCA059A3D84AF05C6",
    "need_sticky_item": true
}

fetch(list_api_url, {
    method: "POST",
    headers: list_headers,
    body: JSON.stringify(list_body)
})
    .then(response => response.json())
    .then(function (json) {
        document.getElementById('list_div').innerHTML = '<samp>' + JSON.stringify(json) + '</samp>';
        document.getElementById('list01').innerHTML = JSON.stringify(json.data.items[0].item_id);
        document.getElementById('list02').innerHTML = JSON.stringify(json.data.items[1].item_id);
        document.getElementById('list03').innerHTML = JSON.stringify(json.data.items[2].item_id);
        document.getElementById('list04').innerHTML = JSON.stringify(json.data.items[3].item_id);
        document.getElementById('list05').innerHTML = JSON.stringify(json.data.items[4].item_id);
    });