<?php
/**
 * Stub generated by xlatte
 */
class Charge extends chargeBase{

    const FLAG_ADDRESS_NOT_NECESSARY = 8;

    /**
     * Creates the charge and returns it
     *
     * @remote
     * @param number $amount
     * @param string $description
     * @param int $idwallet
     * @param int $flags
     * @return Charge
     */
    public static function create($amount, $description, $idwallet = 0, $flags = 0){
        $c = new Charge();
        $c->description = $description;
        $c->amount = $amount;
        $c->flags = $flags;
        $c->insert();

        $w = $idwallet ? Wallet::byAuto($idwallet) : Wallet::defaultWallet();

        if ($w instanceof Wallet && $w->enabled > 0){
            $c->idwallet = $w->idwallet;
            $c->wallet = $w;
        }

        return $c;
    }

    /**
     * @var Wallet
     */
    public $wallet;

}