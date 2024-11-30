# html2llm

This project is an experiment aimed at converting an HTML website into a format understandable by large language models (LLMs). The output can be used for various purposes, such as website navigation or content reading. The project incorporates elements of Microsoft's [Omni Parser](https://github.com/microsoft/OmniParser) release and operates in the browser using WebAssembly. Surprisingly, it performs quite efficiently, with inference taking less than 300ms on my Mac M1.

Demos:

* [⭕ Omni Parser WebAssembly](https://b4rtaz.github.io/html2llm/omni-parser-webassembly.html)
* [📺 App Website](https://b4rtaz.github.io/html2llm/app-website.html)

## 🚧 Idea

The Omni Parser released by Microsoft operates in three steps:

`OCR -> Icon Detection -> Icon Captioning`

This approach enables control over almost any interface. However, it comes with a significant computational cost, particularly in the final step, which is the most resource-intensive part of the pipeline. The icon detection step requires 6.1MB of weights, while the icon captioning step demands 1GB of weights.

Interestingly, in a browser environment, the first and last step can be skipped because we can traverse the DOM tree to extract this information directly. Surprisingly, the second step, which uses YOLOv8, performs efficiently in the browser thanks to [WebAssembly](https://github.com/Hyuto/yolov8-onnxruntime-web).

From the universal approach, we derived the following process:

`Capture a screenshot of the website -> Perform Icon Detection (Omni Parser) -> Generate Icon Captions by traversing the DOM tree`

Now we have two problems:

* how to capture a screenshot of the website ([captureVisibleTab](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureVisibleTab) via a browser extension, [getScreenshotAs](https://www.selenium.dev/selenium/docs/api/java/org/openqa/selenium/TakesScreenshot.html) via Selenium, etc.)
* how to resolve found bounding boxes to useful information (this is definitely not trivial, this part is resolved in this project by the [element extractor](html2llm/src/element-extractor/element-extractor.ts)).

This project is on a very early stage.

## 💡 License

This project is released under the MIT license.

The used part of the Omni Parser is released under the [Creative Commons Attribution 4.0 International license](https://github.com/microsoft/OmniParser/blob/master/LICENSE).
