const banner_api_url = 'https://sfo.data-di.com/api/v2/sfo/section/recommend?org_id=data-di-gcp-taiwan&access_token=d5aad9ab-7f0c-448a-a214-40c2aea1e887'

let banner_headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "project-name": "sinopac_poc"
}

let banner_body = {
    "section_id": "section_id_8322461364774",
    "distinct_id": "100ff36a832edacd",
    "log_id": "WXCA059A3D84AF05C6",
    "need_sticky_item": true
}

fetch(banner_api_url, {
    method: "POST",
    headers: banner_headers,
    body: JSON.stringify(banner_body)
})
    .then(response => response.json())
    .then(function (json) {
        document.getElementById('banner_div').innerHTML = '<samp>' + JSON.stringify(json) + '</samp>';
        document.getElementById('card-title1').innerHTML = JSON.stringify(json.data.items[0].material_properties.string);
        document.getElementById('card-text1').innerHTML = 'Date：'+JSON.stringify(json.data.items[0].material_properties.date)+'<br />Number：'+JSON.stringify(json.data.items[0].material_properties.number)+'<br />Text：'+JSON.stringify(json.data.items[0].material_properties.text)+'<br />RichText：'+JSON.stringify(json.data.items[0].material_properties.richtext);
        document.getElementById('card-img-top1').innerHTML = '<img src='+ JSON.stringify(json.data.items[0].material_properties.image1) +' class="card-img-top"><img src='+ JSON.stringify(json.data.items[0].material_properties.image2) +' class="card-img-top"><img src='+ JSON.stringify(json.data.items[0].material_properties.image3) +' class="card-img-top">';
        document.getElementById('card-link1').innerHTML = '<a href='+ JSON.stringify(json.data.items[0].material_properties.link) +' class="btn btn-primary">LINK</a>';
        document.getElementById('card-title2').innerHTML = JSON.stringify(json.data.items[1].material_properties.string);
        document.getElementById('card-text2').innerHTML = 'Date：'+JSON.stringify(json.data.items[1].material_properties.date)+'<br />Number：'+JSON.stringify(json.data.items[1].material_properties.number)+'<br />Text：'+JSON.stringify(json.data.items[1].material_properties.text)+'<br />RichText：'+JSON.stringify(json.data.items[1].material_properties.richtext);
        document.getElementById('card-img-top2').innerHTML = '<img src='+ JSON.stringify(json.data.items[1].material_properties.image1) +' class="card-img-top"><img src='+ JSON.stringify(json.data.items[1].material_properties.image2) +' class="card-img-top"><img src='+ JSON.stringify(json.data.items[1].material_properties.image3) +' class="card-img-top">';
        document.getElementById('card-link2').innerHTML = '<a href='+ JSON.stringify(json.data.items[1].material_properties.link) +' class="btn btn-primary">LINK</a>';

    });