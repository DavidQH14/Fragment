/**
 * Created by josemanuel on 7/29/16.
 */
module latte {

    export interface IImageGalleryFragment extends IFragment{
        "thumb-fit": "aspect-fit" | "aspect-fill" | "aspect-fill-far" | "aspect-fill-near";
        "thumb-width": number;
        "thumb-height": number;
        "image-fit": "aspect-fit" | "aspect-fill" | "aspect-fill-far" | "aspect-fill-near";
        "image-width": number;
        "image-height": number;
        "print-images": boolean;
    }

    /**
     *
     */
    export class ImageGalleryFragmentAdapter extends FragmentAdapter<IImageGalleryFragment> {

        //region Static

        static PRESENTABLE_KEY = 'presentable';

        static defaultThumbWidth = 200;
        static defaultThumbHeight = 200;
        static defaultImageWidth = 800;
        static defaultImageHeight = 600;


        //endregion

        //region Fields

        //endregion

        /**
         *
         */
        constructor() {
            super();
        }

        //region Private Methods

        /**
         * Uploads the file on the input
         */
        private fileInputChanged(){

            if (this.fileInput.element.files.length > 0) {

                // Get file
                let f = this.fileInput.element.files[0];

                // Create uploader
                let u = new FileUploader(f, 'Page', this.fragment.idpage);

                // Add File Item to show upload process
                let item = new FileItem();
                item.fileUploader = u;
                item.thumbCreated.add(() => this.generatePresentableImage(item, () => this.serialize()));
                this.files.add(item);

                // Start upload
                u.upload();

            }

        }

        /**
         * Generates the presentable image of the specified file item.
         * @param item
         * @param callback
         */
        private generatePresentableImage(item: FileItem, callback: () => void){
            item.file.createThumbChild({
                size: this.imageSize,
                fit:  ImageUtil.imageFitFromString(this.fragmentConfiguration['thumb-fit']) || ImageFit.AspectFill
            }, ImageGalleryFragmentAdapter.PRESENTABLE_KEY, () => callback())
        }

        private moveImageAfter(){
            if(!this.selectedFile) {
                return;
            }

            this.swapSelectedImage(true);
        }

        private moveImageBefore(){

            if(!this.selectedFile) {
                return;
            }

            this.swapSelectedImage(false);

        }

        /**
         * Swaps the selected image with the contigous beofe (or after if the passed flag is true)
         * @param after
         */
        private swapSelectedImage(after: boolean){
            let index = this.files.indexOf(this.selectedFile);

            this.files.each((f) => f.element.detach());

            let indexA = index - 1;
            let indexB = index;

            if(after) {
                indexA = index + 1;
                indexB = index;
            }
            let tmp = this.files[indexA];
            this.files[indexA] = this.selectedFile;
            this.files[indexB] = tmp;

            this.files.each((f) => this.editorItem.element.append(f.element));

            this.updateBeforeAfterButtons();

            this.serialize();
        }

        /**
         * Removes the selected image. (Asking first)
         */
        private removeSelectedImage(){
            if(!this.selectedFile) {
                return;
            }

            DialogView.confirmDelete(this.selectedFile.file.name, () => {
                this.files.remove(this.selectedFile);
                this.selectedFile = null;
                this.serialize();
            });
        }

        /**
         * Updates the enabled property of move before and after buttons
         */
        private updateBeforeAfterButtons(){
            let index = this.files.indexOf(this.selectedFile);

            this.btnMoveImageBefore.enabled = index > 0;
            this.btnMoveImageAfter.enabled = index < (this.files.length - 1);
        }

        private viewSelectedImage(){
            let pic = this.selectedFile.file.getChildByKey(ImageGalleryFragmentAdapter.PRESENTABLE_KEY);

            if(pic) {
                window.open(pic.url)
            }
        }

        private viewSelectedOriginal(){
            window.open(this.selectedFile.file.url)
        }

        //endregion

        //region Methods
        /**
         *
         */
        activateFileInput(){
            this.fileInput.element.click();
        }

        /**
         * Override
         */
        getEditorTabs(): TabItem[]{
            let tabs = [
                this.tabGallery
            ];

            if(this.selectedFile) {
                tabs.push(this.tabImage)
            }

            return tabs;
        }

        /**
         * Returns the items for the ribbon of the view
         * @returns {Array}
         */
        getEditorTabItems(): Item[]{
            let items: Item[] = [this.btnInsertImage];

            if(this.selectedFile) {
                items = items.concat([
                    this.btnViewImage,
                    this.btnViewOriginal,
                    SeparatorItem.withTab(this.tabImage),
                    this.btnMoveImageBefore,
                    this.btnMoveImageAfter,
                    SeparatorItem.withTab(this.tabImage),
                    this.btnRemoveImage
                ]);
            }

            return items;
        }

        /**
         * Override. Raises the <c>createEditorItem</c> event
         */
        onCreateEditorItem(){
            super.onCreateEditorItem();

            this.editorItem = new Item();
            this.editorItem.addClass('gallery-fragment-editor');
            this.editorItem.element.get(0).setAttribute('tabindex', 1);
            this.editorItem.element.get(0).addEventListener('click', () => {
                this.selectedFile = null;
            });
            this.editorItem.element.get(0).addEventListener('focus', () => this.onEditorFocus());
            this.editorItem.element.get(0).addEventListener('blur', () => this.onEditorBlur());
            this.editorItem.element.append(this.fileInput.element);

            this.unserialize();
        }

        /**
         * Raises the <c>selectedFile</c> event
         */
        onSelectedFileChanged(){
            if(this._selectedFileChanged){
                this._selectedFileChanged.raise();
            }

            this.files.each((f) => f.removeClass('selected') );

            if(this.selectedFile) {
                this.selectedFile.addClass('selected');
                this.updateBeforeAfterButtons();
            }

            this.onTabsChanged();
        }

        /**
         * Serializes the file array into the value of the fragment
         */
        serialize(){
            let d = document.createElement('div');

            this.files.each((f: FileItem) => {
                // log(f.file.name)
                let thumb = f.file.getChildByKey(FileItem.SYS_THUMB_KEY);
                let presentable = f.file.getChildByKey(ImageGalleryFragmentAdapter.PRESENTABLE_KEY);

                if(!thumb || !presentable) return;

                let img: HTMLImageElement = document.createElement('img');
                img.setAttribute('data-guid', f.file.guid);
                img.setAttribute('data-thumb-guid', thumb.guid);
                img.setAttribute('data-image-guid', presentable.guid);
                img.setAttribute('data-image-url', presentable.url);
                img.classList.add('thumb');
                img.src = thumb.url;

                d.appendChild(img);
            });

            let oldValue = this.fragment.value;
            this.fragment.value = d.innerHTML;
            this.unsavedChanges = oldValue != this.fragment.value;

            if(this.unsavedChanges) {
                log("Unsaved Changes")
            }

            // log(this.fragment.value);
        }

        /**
         * Unserializes
         */
        unserialize(){

            let guids = [];
            // debugger;
            // log("Unserializing: " + this.fragment.value)
            let d = new Element<HTMLDivElement>(document.createElement('div'));

            // Eval nodes
            d.element.innerHTML = this.fragment.value;

            // Scan nodes
            for(let i in d.element.childNodes){
                let node: Node = d.element.childNodes[i];

                if(node.nodeType == 1) {
                    let img: HTMLImageElement = <HTMLImageElement>node;
                    let guid = img.getAttribute('data-guid');

                    if(guid) {
                        guids.push(img.getAttribute('data-guid'))
                    }
                }
            }

            // Load files
            // HACK: Loading visual cues!
            File.byGuids(guids.join(',')).send((files: File[]) => {
                let sorted = {};
                files.forEach((f) => sorted[f.guid] = f);
                guids.forEach((g) => {
                    if(sorted[g]) {
                        this.files.add(new FileItem(sorted[g]));
                    }
                })
            });

        }

        //endregion

        //region Events
        /**
         * Back field for event
         */
        private _selectedFileChanged: LatteEvent;

        /**
         * Gets an event raised when the value of the selectedFile property changes
         *
         * @returns {LatteEvent}
         */
        get selectedFileChanged(): LatteEvent{
            if(!this._selectedFileChanged){
                this._selectedFileChanged = new LatteEvent(this);
            }
            return this._selectedFileChanged;
        }

        //endregion

        //region Properties

        /**
         * Field for files property
         */
        private _files: Collection<FileItem>;

        /**
         * Gets the files of the editor
         *
         * @returns {Collection<FileItem>}
         */
        get files(): Collection<FileItem> {
            if (!this._files) {
                this._files = new Collection<FileItem>(
                    // Added
                    (f: FileItem) => {
                        this.editorItem.element.append(f.element);
                        f.thumbSize = this.thumbSize;
                        f.element.get(0).addEventListener('click', (e) => {
                            e.stopImmediatePropagation();
                            this.selectedFile = f
                        });
                    },

                    // Removed
                    (f: FileItem) => {
                        f.element.detach();
                    }
                );
            }
            return this._files;
        }

        /**
         * Field for imageSize property
         */
        private _imageSize: Size;

        /**
         * Gets the configured image size
         *
         * @returns {Size}
         */
        get imageSize(): Size {
            if (!this._imageSize) {
                this._imageSize = new Size(
                    this.fragmentConfiguration["image-width"] || ImageGalleryFragmentAdapter.defaultImageWidth,
                    this.fragmentConfiguration["image-height"]|| ImageGalleryFragmentAdapter.defaultImageHeight
                );
            }
            return this._imageSize;
        }

        /**
         * Property field
         */
        private _selectedFile: FileItem = null;

        /**
         * Gets or sets the selected file item
         *
         * @returns {FileItem}
         */
        get selectedFile(): FileItem{
            return this._selectedFile;
        }

        /**
         * Gets or sets the selected file item
         *
         * @param {FileItem} value
         */
        set selectedFile(value: FileItem){

            // Check if value changed
            let changed: boolean = value !== this._selectedFile;

            // Set value
            this._selectedFile = value;

            // Trigger changed event
            if(changed){
                this.onSelectedFileChanged();
            }
        }

        /**
         * Field for thumbSize property
         */
        private _thumbSize: Size;

        /**
         * Gets the configured thumb size
         *
         * @returns {Size}
         */
        get thumbSize(): Size {
            if (!this._thumbSize) {
                this._thumbSize = new Size(
                    this.fragmentConfiguration["thumb-width"] || ImageGalleryFragmentAdapter.defaultThumbWidth,
                    this.fragmentConfiguration["thumb-height"]|| ImageGalleryFragmentAdapter.defaultThumbHeight);
            }
            return this._thumbSize;
        }


        //endregion

        //region Components
        /**
         * Field for btnInsertImage property
         */
        private _btnInsertImage: ButtonItem;

        /**
         * Gets the insert image button
         *
         * @returns {ButtonItem}
         */
        get btnInsertImage(): ButtonItem {
            if (!this._btnInsertImage) {
                this._btnInsertImage = new ButtonItem(strings.insertImage, IconItem.standard(8, 7, 32), () => this.activateFileInput());
                this._btnInsertImage.tab = this.tabGallery;
            }
            return this._btnInsertImage;
        }

        /**
         * Field for btnoveImageAfter property
         */
        private _btnMoveImageAfter: ButtonItem;

        /**
         * Gets the move image after button
         *
         * @returns {ButtonItem}
         */
        get btnMoveImageAfter(): ButtonItem {
            if (!this._btnMoveImageAfter) {
                this._btnMoveImageAfter = new ButtonItem(null, Glyph.right, () => this.moveImageAfter());
                this._btnMoveImageAfter.tooltip = strings.moveImageAfter;
                this._btnMoveImageAfter.tab = this.tabImage;
            }
            return this._btnMoveImageAfter;
        }

        /**
         * Field for btnMoveImageBefore property
         */
        private _btnMoveImageBefore: ButtonItem;

        /**
         * Gets the move image before item
         *
         * @returns {ButtonItem}
         */
        get btnMoveImageBefore(): ButtonItem {
            if (!this._btnMoveImageBefore) {
                this._btnMoveImageBefore = new ButtonItem(null, Glyph.left, () => this.moveImageBefore());
                this._btnMoveImageBefore.tooltip = strings.moveImageBefore
                this._btnMoveImageBefore.tab = this.tabImage;
            }
            return this._btnMoveImageBefore;
        }

        /**
         * Field for btnRemoveImage property
         */
        private _btnRemoveImage: ButtonItem;

        /**
         * Gets the remove image button
         *
         * @returns {ButtonItem}
         */
        get btnRemoveImage(): ButtonItem {
            if (!this._btnRemoveImage) {
                this._btnRemoveImage = new ButtonItem(strings.deleteImage, IconItem.standard(10, 6, 32), () => this.removeSelectedImage());
                this._btnRemoveImage.tab = this.tabImage;
            }
            return this._btnRemoveImage;
        }

        /**
         * Field for btnViewImage property
         */
        private _btnViewImage: ButtonItem;

        /**
         * Gets the view image button
         *
         * @returns {ButtonImage}
         */
        get btnViewImage(): ButtonItem {
            if (!this._btnViewImage) {
                this._btnViewImage = new ButtonItem(strings.viewImage, IconItem.standard(9, 3), () => this.viewSelectedImage());
                this._btnViewImage.tab = this.tabImage;
            }
            return this._btnViewImage;
        }

        /**
         * Field for btnViewOriginal property
         */
        private _btnViewOriginal: ButtonItem;

        /**
         * Gets the view original image button
         *
         * @returns {ButtonItem}
         */
        get btnViewOriginal(): ButtonItem {
            if (!this._btnViewOriginal) {
                this._btnViewOriginal = new ButtonItem(strings.viewOriginal, IconItem.standard(2, 1), () => this.viewSelectedOriginal());
                this._btnViewOriginal.tab = this.tabImage;
            }
            return this._btnViewOriginal;
        }


        /**
         * Field for fileInput property
         */
        private _fileInput: Element<HTMLInputElement>;

        /**
         * Gets the file input
         *
         * @returns {Element<HTMLInputElement>}
         */
        get fileInput(): Element<HTMLInputElement> {
            if (!this._fileInput) {
                this._fileInput = new Element<HTMLInputElement>(document.createElement('input'));
                this._fileInput.element.type = 'file';
                this._fileInput.addEventListener('change', () => this.fileInputChanged())
            }
            return this._fileInput;
        }

        /**
         * Field for tabGallery property
         */
        private _tabGallery: TabItem;

        /**
         * Gets the gallery tab
         *
         * @returns {TabItem}
         */
        get tabGallery(): TabItem {
            if (!this._tabGallery) {
                this._tabGallery = new TabItem(strings.imageGallery);
            }
            return this._tabGallery;
        }

        /**
         * Field for tabImage property
         */
        private _tabImage: TabItem;

        /**
         * Gets the image tab
         *
         * @returns {TabItem}
         */
        get tabImage(): TabItem {
            if (!this._tabImage) {
                this._tabImage = new TabItem(strings.image);
            }
            return this._tabImage;
        }


        //endregion

    }

}