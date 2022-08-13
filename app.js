// Requirements
const express = require("express");
const bodyParser = require('body-parser');
const Jimp = require('jimp');
const { IgApiClient } = require('instagram-private-api');
const { readFile } = require('fs');
const { promisify } = require('util');
const url = require("url");
const fs = require('fs');
const { write } = require("jimp");
const readFileAsync = promisify(readFile);

require("dotenv").config();

//Setup Files which are mandatory by express
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//New NPM Instagram Package Old one was not working
const ig = new IgApiClient()

app.get("/", function (req, res)
{
    res.sendFile(__dirname + "/index.html");
});

const textOnImage = async (year,branch,message) => {

    const image = await Jimp.read("bg-image/bg-images.jpg");

    let fontMessage = "";
    image.resize(900, 900);

    if(message.length < 100)
    {
        console.log(message.length)
        fontMessage = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK).then(font => {
            image.color([{ apply: 'xor', params: ['#008000'] }]);
        });
    }
    else
    {
        console.log(message.length)
        fontMessage = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    }

    const fontYearAndBranch = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    image.print
    (fontMessage,
        90,
        30,
        {
            text:message,
            alignmentX:Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY:Jimp.VERTICAL_ALIGN_MIDDLE
        },
        750,
        750
        );

    image.print(fontYearAndBranch,
        330,
        780,
        {
          text:year,
        },
        350,
        200);

    image.print(fontYearAndBranch,
        490,
        780,
        {
            text:branch,
        },
        150,
        150);

    image.quality(100);

    image.write("bg-image/new-images.jpg");
};

const postImage = async (param1) =>
{
    try {
        ig.state.generateDevice(process.env.INSTAGRAM_USERNAME)
        await ig.simulate.preLoginFlow()
        const user = await ig.account.login(process.env.INSTAGRAM_USERNAME,process.env.INSTAGRAM_PASSWORD)

        const img = './bg-image/new-imag.jpg'
        const published = await ig.publish.photo({
            file: await readFileAsync(img),
            caption: 'The Confession is for @' + param1
        })
        console.log(published)
    }
    catch (err)
    {
        console.log(err)
    }
}

const deleteFile = async () =>
{
    try
    {
        fs.unlinkSync('./bg-image/new-images.jpg');
        console.log("File is deleted.");
    }

    catch (error)
    {
        console.log(error);
    }
}

app.post("/", function (req,res)
{
    const igHandle = req.body.igHandle;
    const year = req.body.yearOfStudy;
    const branch = req.body.branch;
    const confText = req.body.confessionsText;

    textOnImage(year,branch,confText);
    postImage(igHandle);
    deleteFile();

    if(res.statusCode === 200)
    {
        res.sendFile(__dirname + '/success.html')
    }
    else
    {
        res.sendFile(__dirname + '/failure.html')
    }
});

app.post('/')

app.listen(process.env.PORT || 4000, function ()
{
    console.log("Server is running on the port 4000.");
});