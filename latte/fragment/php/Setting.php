<?php
/**
 * Stub generated by xlatte
 */
class Setting extends settingBase{

	/**
	 * @override
	 * @return boolean
	 */
	public function canDelete()
	{
		return true;
	}

    /**
     * Gets the setting of specified owner
     *
     * @param string $name
     * @param int $id
     * @param string $settingName
     * @return Setting
     */
    public static function byOwner($name, $id, $settingName){
        return DL::oneOf('Setting', "
            SELECT *
            FROM `setting`
            WHERE owner = '$name'
            AND idowner = '$id'
            AND name = '$settingName'
        ");
    }

	/**
	 * Search pageTag method
	 *
	 * @remote
	 * @param string $owner
	 * @param string $text
	 * @return Setting[]
	 */
	public static function byOwnerAndText($owner, $text) {
		return DL::arrayOf("Setting", " 
          SELECT DISTINCT #COLUMNS
            FROM `setting`
            WHERE `setting`.owner = '$owner' AND `setting`.value LIKE '%$text%'
          GROUP BY `setting`.value");
	}

	/**
	 * @remote
	 * @param string $owner
	 * @param number $id
	 * @return Setting[]
	 */
	public static function byOwnerOnly($owner, $id) {
		return DL::arrayof(get_class(),"SELECT * FROM `setting` WHERE owner = '$owner' AND idowner = '$id'");
	}

	/**
	 * Creates the pageTag for the specified record
	 *
	 * @remote
	 * @param string $owner
	 * @param int $id
	 * @param string $value
	 * @return Setting
	 * @throws Exception
	 */
	public static function create($owner, $id, $value)
	{
		$record = self::byOwnerOnly($owner, $id);

		foreach ($record as $pageTag) {
			if (strtolower(trim($pageTag->value)) == strtolower(trim($value))) {
				throw new Exception('The tag already added');
			}
		}

		$t = new Setting();
		$t->idowner = $id;
		$t->name = strtolower($owner) . '-' . $id;
		$t->owner = $owner;
		$t->value = $value;
		$t->insert();

		return $t;
	}

    /**
     * Gets the settings of specified owner
     *
     * @param string $name
     * @param int $id
     * @return Setting[]
     */
    public static function byOwnerAll($name, $id){
        return DL::arrayOf('Setting', "
            SELECT *
            FROM `setting`
            WHERE owner = '$name'
            AND idowner = '$id'
        ");
    }

    /**
     * Gets the setting of the specified record
     *
     * @param DataRecord $record
     * @param string $settingName
     * @return Setting
     */
    public static function byRecord($record, $settingName){
        return self::byOwner(get_class($record), $record->getIdValue(), $settingName);
    }

    /**
     * Gets the settings of the specified record
     *
     * @param DataRecord $record
     * @return Setting[]
     */
    public static function byRecordAll($record){
        return self::byOwnerAll(get_class($record), $record->getIdValue());
    }

    /**
     * Gets the global settings of the app
     *
     * @remote
     * @param string $name
     * @return Setting
     */
    public static function getGlobal($name){
        return DL::oneOf('Setting', "
            SELECT #COLUMNS
            FROM setting
            WHERE owner = 'global'
            AND idowner = 0
            AND name = '$name'
        ");
    }

    /**
     * Gets the global settings of the app
     *
     * @remote
     * @return Setting[]
     */
    public static function getGlobals(){
        return DL::arrayOf('Setting', "
            SELECT #COLUMNS
            FROM setting
            WHERE owner = 'global'
            AND idowner = 0
        ");
    }

    /**
     * Gets the global setting by name. Only for root users
     * @remote
     * @param string $name
     * @return Setting
     * @throws SecurityException
     */
    public static function getGlobalByName($name){
        if(!Session::me()->isRoot()){
            throw new SecurityException("Only for root");
        }
        $s = Setting::byOwner('global', 0, $name);

        if (!$s){
            $s = new Setting();
            $s->idowner = 0;
            $s->owner = 'global';
            $s->name = $name;
            $s->insert();
        }

        return $s;
    }

    /**
     * @remote
     * @return IGlobalConfigSettings
     */
    public static function getGlobalConfigurableSettings(){

        /*
            new SettingExplorer('analytics-account', LinearIcon.chart_bars),
            new SettingExplorer('home', LinearIcon.home),
            new SettingExplorer('theme', LinearIcon.layers),
            new SettingExplorer('title', LinearIcon.graduation_hat),
         */

        $result = array(
//            'analytics-account' => array(
//                'icon' => 'chart_bars',
//            ),
            'home' => array(
                'icon' => 'home'
            ),
            'theme' => array(
                'icon' => 'layers'
            ),
            'title' => array(
                'icon' => 'graduation_hat'
            ),
            'inline-js' => array(
                'icon' => 'menu',
                'type' => 'switch'
            ),
            'inline-css' => array(
                'icon' => 'menu',
                'type' => 'switch'
            ),
            'image-quality' => array(
                'icon' => 'picture',
                'type' => 'number'
            )
        );

        $collect = event_raise('get_global_configuration_settings');

        foreach($collect as $arr){
            $result = array_merge($result, $arr);
        }

        return $result;

    }

    /**
     * Gets the setting of specified owner
     *
     * @param string $name
     * @param int $id
     * @param string $settingName
     * @return string
     */
    public static function getValue($name, $id, $settingName){
        $s = DL::oneOf('Setting', "
            SELECT *
            FROM `setting`
            WHERE owner = '$name'
            AND idowner = '$id'
            AND name = '$settingName'
        ");

        if ($s){
            return $s->value;
        }

        return null;
    }

    /**
     * Gets the setting of specified owner
     *
     * @param string $name
     * @param int $id
     * @param string $settingName
     * @param string $value
     * @return Setting
     */
    public static function setValue($name, $id, $settingName, $value){
        $s = DL::oneOf('Setting', "
            SELECT *
            FROM `setting`
            WHERE owner = '$name'
            AND idowner = '$id'
            AND name = '$settingName'
        ");

        if ($s){
            $s->value = $value;
            $s->save();
        }else{
            $s = new Setting();
            $s->owner = $name;
            $s->idowner = $id;
            $s->name = $settingName;
            $s->value = $value;
            $s->save();
        }

        return $s;
    }

    /**
     * Sets the owner and saves the record
     * @param $record
     */
    public function saveForRecord($record){
        $this->idowner = $record->getIdValue();
        $this->owner = get_class($record);
        $this->save();
    }

    /**
     * Override.
     * @throws SecurityException
     */
    public function onUpdating(){

        // If setting is the configuration of the page.
        // Take in account the required permission.
        if($this->owner == 'Page' && $this->name == 'page-configuration'){
            $page = Page::byAuto($this->idowner);

            if(!$page->canIWrite()){
                throw new SecurityException("Only owner, root or sys-admin may configure pages. " . $page->isMine() . " - " . $page->isOnline());
            }
        }
    }

    public function __toString(){
        return $this->value ? $this->value : '';
    }

}