# rnbo-sanctuary-in-sound
A RNBO web-based interactive that allows one to explore an 8x8 habitat map of Gray's Reef National Marine Sanctuary (GRNMS). This is a proof-of-concept for future auditory display and sonification work for the web.

## The main web folder 

**App.js** is the main code linking RNBO to P5JS.  
For example, you just need to know the RNBO.device parameters and stuff JS variables as their values.

e.g. device.parametersById.get('habitat').value = habitat_num;

Where device.parametersById.get('habitat').value is the RNBO side variable that plays the audio, 
and habitat_num is the JS/HTML side variable that gets updated based on user interaction.

**index.html** is the webpage.

**patch.export.json** is the RNBO max patch/

The **js/** and **css/** folders are just the responsive web design. No need to mess with these. Mine is just the free download of this [Basic Responsive Template](https://graygrids.com/templates/basic-responsive-bootstrap-4-template) free web template.

If you want a different responsive web design go for it!

---

## Other Notes

Great for testing is to use Terminal and “npx http-server” — see [Cycling 74 RNBO github example](https://github.com/Cycling74/rnbo.example.webpage)

P5JS can be made more accessible: 

[p5.accessibility.js](https://p5js.org/contribute/web_accessibility/)

Developers can use describe(), describeElement(), textOutput(), or gridOutput() to provide text descriptions for screen readers.
To achieve compliance, developers must use describe() or describeElement() to provide text alternatives for visual content.
