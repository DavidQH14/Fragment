/**
 * Created by josemanuel on 11/1/16.
 */
module latte {

    /**
     *
     */
    export class PaymentClickable extends PaymentClickableBase {

        //region Static
        //endregion

        //region Fields
        //endregion

        /**
         *
         */
        constructor(text: string, sideText: string = null) {
            super();

            this.label.text = text;

            if(sideText) {
                this.extra.text = sideText;
            }
        }

        //region Private Methods
        //endregion

        //region Methods
        //endregion

        //region Events
        //endregion

        //region Properties
        //endregion

    }

}